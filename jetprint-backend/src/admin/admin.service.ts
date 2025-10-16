import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReassignClaimDto } from './dto/reassign-claim.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Reassigns an order's active stage claim from its current holder to a new staff member.
   * This is an admin override action.
   */
  async reassignClaim(reassignClaimDto: ReassignClaimDto) {
    const { orderId, newUserId } = reassignClaimDto;

    // Use a transaction to ensure all database operations succeed or fail together.
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify the new user exists and is a staff member
      const newUser = await tx.user.findUnique({ where: { id: newUserId } });
      if (!newUser || newUser.role !== UserRole.STAFF) {
        throw new NotFoundException(
          `Staff user with ID "${newUserId}" not found.`,
        );
      }

      // 2. Find the order and its current ACTIVE claim (where completedAt is null)
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          // CORRECT: Use 'stageClaims' instead of 'claim'
          stageClaims: {
            where: { completedAt: null },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID "${orderId}" not found.`);
      }

      // 3. Check if there is an active claim to reassign
      if (order.stageClaims.length === 0) {
        throw new ConflictException(
          'This order is not currently claimed and cannot be reassigned.',
        );
      }

      const currentClaim = order.stageClaims[0];

      // 4. Update the existing active claim with the new user's ID
      // CORRECT: Use 'stageClaim' model to update
      const updatedClaim = await tx.stageClaim.update({
        where: { id: currentClaim.id },
        data: {
          userId: newUserId,
        },
      });

      return updatedClaim;
    });
  }

  /**
   * Retrieves all stage claim entries to serve as a system-wide audit trail.
   */
  getAuditLogs() {
    // CORRECT: The audit log is now derived from the 'stageClaim' model.
    return this.prisma.stageClaim.findMany({
      orderBy: {
        claimedAt: 'desc', // Show the most recent events first
      },
      include: {
        // Include context to make the log useful
        order: {
          select: {
            id: true,
            customerPhone: true,
          },
        },
        user: {
          select: {
            phone: true, // Show which user performed the action
          },
        },
      },
    });
  }

  /**
   * Get all stages with assigned users
   */
  async getAllStages() {
    return this.prisma.stage.findMany({
      include: {
        users: {
          select: {
            id: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Create a new stage
   */
  async createStage(name: any) {
    // Check if stage already exists
    const existing = await this.prisma.stage.findUnique({
      where: { name },
    });

    if (existing) {
      throw new ConflictException('Stage already exists');
    }

    return this.prisma.stage.create({
      data: { name },
      include: {
        users: true,
      },
    });
  }

  /**
   * Assign users to a stage
   */
  async assignUsersToStage(stageId: string, userIds: string[]) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.stage.update({
      where: { id: stageId },
      data: {
        users: {
          set: userIds.map(id => ({ id })),
        },
      },
      include: {
        users: {
          select: {
            id: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Delete a stage
   */
  async deleteStage(stageId: string) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.stage.delete({
      where: { id: stageId },
    });
  }

  /**
   * Update order stage (admin override)
   */
  async updateOrderStage(orderId: string, newStage: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { currentStage: newStage },
    });
  }

  /**
   * Get comprehensive statistics for the dashboard
   */
  async getStatistics() {
    // Get all orders with products
    const orders = await this.prisma.order.findMany({
      include: {
        products: true,
        creator: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    // Calculate totals
    let totalOrderAmount = 0;
    let totalDesignAmount = 0;
    let totalShippingAmount = 0;

    // User-wise statistics
    const userStats = new Map<string, {
      userId: string;
      phone: string;
      ordersCreated: number;
      totalAmount: number;
      designAmount: number;
      shippingAmount: number;
    }>();

    orders.forEach(order => {
      let orderAmount = 0;
      let orderDesignAmount = 0;

      order.products.forEach(product => {
        const productPrice = Number(product.price);
        const designAmount = product.needsDesign ? Number(product.designAmount || 0) : 0;

        orderAmount += productPrice;
        orderDesignAmount += designAmount;
        totalOrderAmount += productPrice;
        totalDesignAmount += designAmount;
      });

      const shippingAmount = Number(order.shippingPrice || 0);
      totalShippingAmount += shippingAmount;

      // Update user stats
      const creatorId = order.creator.id;
      if (!userStats.has(creatorId)) {
        userStats.set(creatorId, {
          userId: creatorId,
          phone: order.creator.phone,
          ordersCreated: 0,
          totalAmount: 0,
          designAmount: 0,
          shippingAmount: 0,
        });
      }

      const stats = userStats.get(creatorId)!;
      stats.ordersCreated += 1;
      stats.totalAmount += orderAmount;
      stats.designAmount += orderDesignAmount;
      stats.shippingAmount += shippingAmount;
    });

    // Stage statistics
    const stageCounts = await this.prisma.order.groupBy({
      by: ['currentStage'],
      _count: {
        id: true,
      },
    });

    return {
      overall: {
        totalOrders: orders.length,
        totalOrderAmount: totalOrderAmount.toFixed(2),
        totalDesignAmount: totalDesignAmount.toFixed(2),
        totalShippingAmount: totalShippingAmount.toFixed(2),
        grandTotal: (totalOrderAmount + totalDesignAmount + totalShippingAmount).toFixed(2),
      },
      byUser: Array.from(userStats.values()).map(stat => ({
        ...stat,
        totalAmount: stat.totalAmount.toFixed(2),
        designAmount: stat.designAmount.toFixed(2),
        shippingAmount: stat.shippingAmount.toFixed(2),
      })),
      byStage: stageCounts.map(stage => ({
        stage: stage.currentStage,
        count: stage._count.id,
      })),
    };
  }
}