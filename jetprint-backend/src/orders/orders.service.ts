import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User, OrderStage } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    creator: User,
    // ✅ FIX: Use the correct global namespace type
    uploadedFiles: Array<Express.Multer.File>,
  ) {
    // ... (rest of the service code is the same)
    const productsDto: CreateProductDto[] = JSON.parse(createOrderDto.products);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerName: createOrderDto.customerName,
          customerPhone: createOrderDto.customerPhone,
          branchId: createOrderDto.branchId,
          creatorId: creator.id,
          isUrgent: createOrderDto.isUrgent,
          shippingPrice: createOrderDto.shippingPrice,
          notes: createOrderDto.notes,
          currentStage: OrderStage.WAITING,
        },
      });

      for (let i = 0; i < productsDto.length; i++) {
        const productData = productsDto[i];
        const product = await tx.product.create({
          data: {
            width: productData.width,
            height: productData.height,
            quantity: productData.quantity,
            price: productData.price,
            needsDesign: productData.needsDesign,
            designAmount: productData.designAmount,
            needsCut: productData.needsCut,
            needsLamination: productData.needsLamination,
            paperType: productData.paperType,
            name: productData.name,
            orderId: order.id,
          },
        });

        const productFiles = uploadedFiles.filter(file => file.fieldname.startsWith(`products[${i}]`));

        if (productFiles.length > 0) {
          await tx.file.createMany({
            data: productFiles.map(file => ({
              url: (file as any).location || `/uploads/${file.filename}`,
              fileName: file.originalname,
              fileType: file.mimetype,
              size: file.size,
              productId: product.id,
            })),
          });
        }
      }

      // Notify order creator and available stage users
      this.notificationsService.notifyOrderCreated(order.id, creator.id);
      this.notificationsService.notifyOrderAvailableForStage(order.id, OrderStage.WAITING);

      return order;
    });
  }

  async findAllAvailable(user: User) {
    const userWithStages = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { stages: true },
    });
    
    if (!userWithStages) throw new NotFoundException('User not found.');
    
    const userStageNames = userWithStages.stages.map(s => s.name);

    return this.prisma.order.findMany({
      where: {
        currentStage: { in: userStageNames },
        stageClaims: {
          none: {
            stage: { in: userStageNames },
            completedAt: null,
          },
        },
      },
      include: {
        branch: true,
        creator: { select: { phone: true } },
        products: true,
        stageClaims: {
          where: { completedAt: null },
          include: { user: { select: { phone: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        branch: true,
        creator: { select: { phone: true } },
        products: { include: { files: true } },
        stageClaims: {
          include: { user: { select: { phone: true } } },
          orderBy: { claimedAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return order;
  }

  /**
   * Generate confirmation message for customer
   * Can be sent via WhatsApp, Telegram, or Messenger
   */
  async generateConfirmationMessage(orderId: string) {
    const order = await this.findOne(orderId);
    
    let message = `📋 JetPrint Order Confirmation\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Order ID: #${order.id.substring(0, 8).toUpperCase()}\n`;
    message += `Branch: ${order.branch.name}\n`;
    
    if (order.customerName) {
      message += `Customer: ${order.customerName}\n`;
    }
    message += `Phone: ${order.customerPhone}\n`;
    message += `Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
    
    message += `📦 Products:\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    let totalAmount = 0;
    let totalDesignAmount = 0;
    
    order.products.forEach((product, index) => {
      message += `\n${index + 1}. ${product.name || 'Product'}\n`;
      message += `   • Size: ${product.width} x ${product.height} cm\n`;
      message += `   • Quantity: ${product.quantity}\n`;
      message += `   • Paper: ${product.paperType}\n`;
      message += `   • Price: $${Number(product.price).toFixed(2)}\n`;
      
      if (product.needsDesign) {
        message += `   • Design Work: $${Number(product.designAmount).toFixed(2)}\n`;
        totalDesignAmount += Number(product.designAmount);
      }
      if (product.needsCut) {
        message += `   • Special Cut: Yes\n`;
      }
      if (product.needsLamination) {
        message += `   • Lamination: Yes\n`;
      }
      
      totalAmount += Number(product.price);
    });
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 Summary:\n`;
    message += `   Products Total: $${totalAmount.toFixed(2)}\n`;
    
    if (totalDesignAmount > 0) {
      message += `   Design Work: $${totalDesignAmount.toFixed(2)}\n`;
    }
    
    if (order.shippingPrice) {
      message += `   Shipping: $${Number(order.shippingPrice).toFixed(2)}\n`;
      totalAmount += Number(order.shippingPrice);
    }
    
    totalAmount += totalDesignAmount;
    message += `   ─────────────────\n`;
    message += `   TOTAL: $${totalAmount.toFixed(2)}\n`;
    
    if (order.isUrgent) {
      message += `\n⚡ URGENT ORDER\n`;
    }
    
    if (order.notes) {
      message += `\n📝 Notes: ${order.notes}\n`;
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 Terms & Conditions:\n`;
    message += `• Payment must be completed before delivery\n`;
    message += `• Design revisions: Up to 2 rounds included\n`;
    message += `• Color accuracy: Digital proofs may vary from print\n`;
    message += `• Delivery: 2-5 business days (standard orders)\n`;
    message += `• Urgent orders: Additional fees may apply\n\n`;
    message += `✅ Please reply "CONFIRM" to proceed with this order.\n`;
    message += `\nThank you for choosing JetPrint! 🎨`;
    
    return message;
  }

  /**
   * Update shipping price after order creation
   */
  async updateShippingPrice(orderId: string, shippingPrice: number) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { shippingPrice },
    });
  }

  /**
   * Update order notes
   */
  async updateNotes(orderId: string, notes: string) {
    const order = await this.findOne(orderId);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { notes },
    });
  }

  /**
   * Upload file to order
   */
  async uploadOrderFile(orderId: string, file: Express.Multer.File) {
    const order = await this.findOne(orderId);
    
    // For simplicity, attach to first product
    // In a real app, you might want to specify which product
    const firstProduct = order.products[0];
    
    if (!firstProduct) {
      throw new NotFoundException('Order has no products');
    }

    return this.prisma.file.create({
      data: {
        url: (file as any).location || `/uploads/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
        size: file.size,
        productId: firstProduct.id,
      },
    });
  }

  /**
   * Get all files for an order
   */
  async getOrderFiles(orderId: string) {
    const order = await this.findOne(orderId);
    
    const files = await this.prisma.file.findMany({
      where: {
        product: {
          orderId: orderId,
        },
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    return files;
  }

  /**
   * Delete order file
   */
  async deleteOrderFile(orderId: string, fileId: string) {
    // Verify the file belongs to this order
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        product: {
          select: {
            orderId: true,
          },
        },
      },
    });

    if (!file || file.product.orderId !== orderId) {
      throw new NotFoundException('File not found or does not belong to this order');
    }

    return this.prisma.file.delete({
      where: { id: fileId },
    });
  }
}