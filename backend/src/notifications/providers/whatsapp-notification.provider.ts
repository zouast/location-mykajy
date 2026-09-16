import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationDeliveryResult,
  NotificationPayload,
  NotificationProvider,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class WhatsAppNotificationProvider implements NotificationProvider {
  readonly channel = NotificationChannel.WHATSAPP;
  private readonly logger = new Logger(WhatsAppNotificationProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    const apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN');
    return !!apiToken;
  }

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    const timestamp = new Date();

    if (!payload.userPhone) {
      return {
        success: false,
        channel: this.channel,
        error: 'userPhone is required for WhatsApp notifications',
        timestamp,
      };
    }

    if (!this.isAvailable()) {
      this.logger.warn('WhatsApp provider not configured — skipping');
      return {
        success: false,
        channel: this.channel,
        error: 'WhatsApp provider not configured',
        timestamp,
      };
    }

    try {
      // TODO: Implémenter l'envoi réel via WhatsApp Business API
      this.logger.log(`[WHATSAPP] Sending to ${payload.userPhone}: ${payload.title}`);

      return {
        success: true,
        channel: this.channel,
        messageId: `wa-${Date.now()}`,
        timestamp,
      };
    } catch (err: any) {
      this.logger.error(`Failed to send WhatsApp message: ${err.message}`, err.stack);
      return {
        success: false,
        channel: this.channel,
        error: err.message,
        timestamp,
      };
    }
  }
}
