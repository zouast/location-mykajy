import {
  NotificationChannel,
  NotificationPayload,
  NotificationType,
} from '../interfaces/notification-provider.interface';

export class SendNotificationDto implements NotificationPayload {
  userId?: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  type: NotificationType | string;
  title: string;
  content: string;
  link?: string;
  actionText?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
}
