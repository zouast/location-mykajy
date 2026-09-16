import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationDeliveryResult,
  NotificationPayload,
  NotificationProvider,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class SmsNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.SMS;
  private readonly logger = new Logger(SmsNotificationProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    // En production, vérifier la config Twilio ou Orange SMS
    const apiKey = this.configService.get<string>('SMS_API_KEY');
    return !!apiKey;
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    const timestamp = new Date();

    if (!payload.userPhone) {
      return {
        success: false,
        channel: this.channel,
        error: 'userPhone is required for SMS notifications',
        timestamp,
      };
    }

    if (!this.isAvailable()) {
      this.logger.warn('SMS provider not configured — skipping');
      return {
        success: false,
        channel: this.channel,
        error: 'SMS provider not configured',
        timestamp,
      };
    }

    try {
      // TODO: Implémenter l'envoi réel (Twilio, Africa's Talking, etc.)
      this.logger.log(`[SMS] Sending to ${payload.userPhone}: ${payload.title}`);

      return {
        success: true,
        channel: this.channel,
        messageId: `sms-${Date.now()}`,
        timestamp,
      };
    } catch (err: any) {
      this.logger.error(`Failed to send SMS: ${err.message}`, err.stack);
      return {
        success: false,
        channel: this.channel,
        error: err.message,
        timestamp,
      };
    }
  }
}
