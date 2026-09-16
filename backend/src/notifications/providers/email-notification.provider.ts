import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationDeliveryResult,
  NotificationPayload,
  NotificationProvider,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class EmailNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(EmailNotificationProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    // En production, vérifier la configuration SMTP
    return true;
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    const timestamp = new Date();

    if (!payload.userEmail) {
      return {
        success: false,
        channel: this.channel,
        error: 'userEmail is required for email notifications',
        timestamp,
      };
    }

    try {
      // TODO: Implémenter l'envoi réel d'email (Nodemailer, SendGrid, etc.)
      this.logger.log(
        `[EMAIL] Sending to ${payload.userEmail}: ${payload.title}`,
      );

      // Simulation d'envoi email
      return {
        success: true,
        channel: this.channel,
        messageId: `email-${Date.now()}`,
        timestamp,
      };
    } catch (err: any) {
      this.logger.error(`Failed to send email notification: ${err.message}`, err.stack);
      return {
        success: false,
        channel: this.channel,
        error: err.message,
        timestamp,
      };
    }
  }
}
