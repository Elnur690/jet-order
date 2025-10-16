import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { User, OrderStage } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStageClaimDto } from './dto/create-stage-claim.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

// A helper to define the workflow order
const STAGE_WORKFLOW: OrderStage[] = [
  OrderStage.WAITING,
  OrderStage.DESIGN,
  OrderStage.PRINT_READY,
  OrderStage.PRINTING,
  OrderStage.CUT,
  OrderStage.COMPLETED,
  OrderStage.DELIVERED,
];

@Injectable()
export class StageClaimsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // This is the "Claim Order" action
  async create(createDto: CreateStageClaimDto, user: User) {
    const { orderId } = createDto;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { stageClaims: { where: { completedAt: null } } },
      });

      if (!order) throw new NotFoundException('Order not found.');
      if (order.stageClaims.length > 0)
        throw new ConflictException('Order is already actively claimed.');

      const userWithStages = await tx.user.findUnique({
        where: { id: user.id },
        include: { stages: true },
      });
      const hasPermission = userWithStages?.stages.some(
        (s) => s.name === order.currentStage,
      );
      if (!hasPermission)
        throw new ForbiddenException(
          `You do not have permission for the ${order.currentStage} stage.`,
        );

      const claim = await tx.stageClaim.create({
        data: {
          orderId: orderId,
          userId: user.id,
          stage: order.currentStage,
        },
      });

      // Notify user about the claim
      this.notificationsService.notifyOrderClaimed(
        orderId,
        user.id,
        order.currentStage,
      );

      return claim;
    });
  }

  // This is the "Send to Next Stage" action
  async advanceStage(claimId: string, user: User) {
    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.stageClaim.findUnique({
        where: { id: claimId },
        include: { 
          order: {
            include: {
              products: true
            }
          } 
        },
      });

      if (!claim) throw new NotFoundException('Claim not found.');
      if (claim.userId !== user.id)
        throw new ForbiddenException('You do not own this claim.');
      if (claim.completedAt)
        throw new BadRequestException('This stage has already been completed.');

      // 1. Mark the current claim as completed
      const completedClaim = await tx.stageClaim.update({
        where: { id: claimId },
        data: { completedAt: new Date() },
      });

      // 2. Find the next stage in the workflow
      const currentStageIndex = STAGE_WORKFLOW.indexOf(
        claim.order.currentStage,
      );
      let nextStage = STAGE_WORKFLOW[currentStageIndex + 1];

      // 3. Smart workflow: Skip DESIGN stage if no product needs design
      if (claim.order.currentStage === OrderStage.WAITING && nextStage === OrderStage.DESIGN) {
        const needsDesign = claim.order.products.some(p => p.needsDesign);
        if (!needsDesign) {
          // Skip DESIGN, go to PRINT_READY
          nextStage = OrderStage.PRINT_READY;
        }
      }

      // 4. Update the order's currentStage
      if (nextStage) {
        await tx.order.update({
          where: { id: claim.orderId },
          data: { currentStage: nextStage },
        });

        // Notify user about advancement
        this.notificationsService.notifyOrderAdvanced(
          claim.orderId,
          user.id,
          claim.order.currentStage,
          nextStage,
        );

        // Notify users available for next stage
        this.notificationsService.notifyOrderAvailableForStage(
          claim.orderId,
          nextStage,
        );
      }

      return completedClaim;
    });
  }

  findMyActiveClaims(userId: string) {
    return this.prisma.stageClaim.findMany({
      where: { userId: userId, completedAt: null },
      include: {
        order: {
          include: {
            branch: true,
            products: true,
          },
        },
      },
      orderBy: { claimedAt: 'asc' },
    });
  }

  findMyCompletedClaims(userId: string) {
    return this.prisma.stageClaim.findMany({
      where: { userId: userId, completedAt: { not: null } },
      include: {
        order: {
          include: {
            branch: true,
            products: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  findMyAllClaims(userId: string) {
    return this.prisma.stageClaim.findMany({
      where: { userId: userId },
      include: {
        order: {
          include: {
            branch: true,
            products: true,
          },
        },
      },
      orderBy: { claimedAt: 'desc' },
    });
  }
}