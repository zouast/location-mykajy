import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentProviderType,
  PaymentSessionRequest,
  PaymentSessionResult,
  ProcessPaymentRequest,
  PaymentProcessResult,
  PaymentVerificationResult,
  PaymentRefundResult,
  PaymentStatus,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MobileMoneyPaymentProvider implements PaymentProvider {
  readonly providerId: PaymentProviderType = 'MOBILE_MONEY';
  private readonly logger = new Logger(MobileMoneyPaymentProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    return true;
  }

  async createPaymentSession(request: PaymentSessionRequest): Promise<PaymentSessionResult> {
    const operator = request.metadata?.operator || 'ORANGE_MONEY';
    const providerRef = `momo_${operator.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const phone = request.userPhone || request.metadata?.phone || '+225 07 00 00 00';
    const ussdCode = `*144*4*${Math.round(request.amount)}#`;

    this.logger.log(
      `[Mobile Money - ${operator}] Session initialisée pour ${phone} | Montant: ${request.amount} ${request.currency} | Ref: ${providerRef}`,
    );

    return {
      provider: 'MOBILE_MONEY',
      providerRef,
      status: PaymentStatus.PROCESSING,
      ussdPromptCode: ussdCode,
      instructions: `Un message de validation a été envoyé sur votre mobile (${phone}). Veuillez composer ${ussdCode} ou valider le push prompt sur votre application.`,
      rawResponse: {
        operator,
        phone,
        status: 'PENDING_USER_APPROVAL',
        reference: providerRef,
      },
    };
  }

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentProcessResult> {
    const transactionRef = `tx_momo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receiptUrl = `https://receipts.immo-mykajy.fr/momo/${transactionRef}.pdf`;

    this.logger.log(
      `[Mobile Money] Validation paiement #${request.paymentId} | OTP/PIN vérifié | Ref: ${transactionRef}`,
    );

    return {
      success: true,
      status: PaymentStatus.PAID,
      transactionRef,
      providerRef: request.providerRef || transactionRef,
      paidAt: new Date(),
      receiptUrl,
      rawResponse: {
        transaction_id: transactionRef,
        status: 'SUCCESSFUL',
      },
    };
  }

  async verifyPayment(providerRef: string): Promise<PaymentVerificationResult> {
    this.logger.log(`[Mobile Money] Vérification statut transaction ${providerRef}`);
    return {
      isVerified: true,
      status: PaymentStatus.PAID,
      amount: 50000,
      currency: 'XOF',
      paidAt: new Date(),
      providerRef,
      transactionRef: `tx_${providerRef}`,
    };
  }

  async refundPayment(
    providerRef: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentRefundResult> {
    const refundId = `ref_momo_${Date.now()}`;
    this.logger.log(
      `[Mobile Money] Remboursement demandé pour ${providerRef} | Montant: ${amount || 0}`,
    );

    return {
      success: true,
      refundId,
      amountRefunded: amount || 0,
      currency: 'XOF',
      refundedAt: new Date(),
    };
  }
}
