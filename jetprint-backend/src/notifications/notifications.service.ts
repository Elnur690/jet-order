import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  orderId?: string;
  userId: string;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    private websocketGateway: WebsocketGateway,
    private prisma: PrismaService,
  ) {}

  /**
   * Send a notification to a specific user via WebSocket
   */
  sendNotificationToUser(userId: string, notification: Omit<Notification, 'id' | 'createdAt'>) {
    const fullNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    
    // Broadcast to all connected clients - clients should filter by userId
    this.websocketGateway.broadcast('notification', fullNotification);
    
    return fullNotification;
  }

  /**
   * Notify when an order is created
   */
  notifyOrderCreated(orderId: string, creatorId: string) {
    return this.sendNotificationToUser(creatorId, {
      message: `Order #${orderId.substring(0, 8)} has been created successfully`,
      type: 'success',
      orderId,
      userId: creatorId,
    });
  }

  /**
   * Notify when an order is claimed
   */
  notifyOrderClaimed(orderId: string, userId: string, stage: string) {
    return this.sendNotificationToUser(userId, {
      message: `You claimed order #${orderId.substring(0, 8)} at ${stage} stage`,
      type: 'info',
      orderId,
      userId,
    });
  }

  /**
   * Notify when an order advances to next stage
   */
  notifyOrderAdvanced(orderId: string, userId: string, fromStage: string, toStage: string) {
    return this.sendNotificationToUser(userId, {
      message: `Order #${orderId.substring(0, 8)} moved from ${fromStage} to ${toStage}`,
      type: 'success',
      orderId,
      userId,
    });
  }

  /**
   * Notify when order is available for a user's stage
   */
  async notifyOrderAvailableForStage(orderId: string, stage: string) {
    // Find all users assigned to this stage
    const stageRecord = await this.prisma.stage.findUnique({
      where: { name: stage as any },
      include: { users: true },
    });

    if (stageRecord) {
      stageRecord.users.forEach(user => {
        this.sendNotificationToUser(user.id, {
          message: `New order #${orderId.substring(0, 8)} is available for ${stage} stage`,
          type: 'info',
          orderId,
          userId: user.id,
        });
      });
    }
  }

  /**
   * Check for overdue orders (not delivered in 2 business days)
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueOrders() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find orders created more than 2 days ago that are not delivered
    const overdueOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { lt: twoDaysAgo },
        currentStage: { not: 'DELIVERED' },
      },
      include: {
        creator: true,
      },
    });

    // Count business days (excluding Sunday)
    const isBusinessDay = (date: Date) => {
      const day = date.getDay();
      return day !== 0; // 0 = Sunday
    };

    overdueOrders.forEach(order => {
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate business days
      let businessDays = 0;
      const checkDate = new Date(order.createdAt);
      for (let i = 0; i < daysSinceCreation; i++) {
        if (isBusinessDay(checkDate)) {
          businessDays++;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      if (businessDays >= 2) {
        this.sendNotificationToUser(order.creatorId, {
          message: `⚠️ Order #${order.id.substring(0, 8)} is overdue! Created ${businessDays} business days ago and still not delivered. Current stage: ${order.currentStage}`,
          type: 'warning',
          orderId: order.id,
          userId: order.creatorId,
        });
      }
    });
  }
}
