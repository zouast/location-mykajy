import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { InAppNotificationProvider } from './providers/in-app-notification.provider';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import { SmsNotificationProvider } from './providers/sms-notification.provider';
import { WhatsAppNotificationProvider } from './providers/whatsapp-notification.provider';

@Global()
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    InAppNotificationProvider,
    EmailNotificationProvider,
    SmsNotificationProvider,
    WhatsAppNotificationProvider,
  ],
  exports: [
    NotificationsService,
    InAppNotificationProvider,
    EmailNotificationProvider,
    SmsNotificationProvider,
    WhatsAppNotificationProvider,
  ],
})
export class NotificationsModule {}
