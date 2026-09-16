import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { MobileMoneyPaymentProvider } from './providers/mobile-money-payment.provider';
import { BankTransferPaymentProvider } from './providers/bank-transfer-payment.provider';
import { ManualPaymentProvider } from './providers/manual-payment.provider';

@Module({
  imports: [DatabaseModule, NotificationsModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripePaymentProvider,
    MobileMoneyPaymentProvider,
    BankTransferPaymentProvider,
    ManualPaymentProvider,
  ],
  exports: [
    PaymentsService,
    StripePaymentProvider,
    MobileMoneyPaymentProvider,
    BankTransferPaymentProvider,
    ManualPaymentProvider,
  ],
})
export class PaymentsModule {}
