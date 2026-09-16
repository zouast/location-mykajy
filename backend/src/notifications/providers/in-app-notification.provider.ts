import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  NotificationChannel,
  NotificationDeliveryResult,
  NotificationPayload,
  NotificationProvider,
  NotificationType,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class InAppNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.IN_APP;
  private readonly logger = new Logger(InAppNotificationProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  isAvailable(): boolean {
    return true;
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    const timestamp = new Date();

    if (!payload.userId) {
      return {
        success: false,
        channel: this.channel,
        error: 'userId is required for in-app notifications',
        timestamp,
      };
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type as any,
          title: payload.title,
          content: payload.content,
          link: payload.link,
          metadata: {
            ...(payload.metadata || {}),
            ...(payload.actionText ? { actionText: payload.actionText } : {}),
          },
          isRead: false,
        },
      });

      return {
        success: true,
        channel: this.channel,
        messageId: notification.id,
        timestamp,
      };
    } catch (err: any) {
      this.logger.error(`Failed to create in-app notification: ${err.message}`, err.stack);
      return {
        success: false,
        channel: this.channel,
        error: err.message,
        timestamp,
      };
    }
  }
}
