import { Injectable, Logger } from '@nestjs/common';
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
export class ManualPaymentProvider implements PaymentProvider {
  readonly providerId: PaymentProviderType = 'MANUAL';
  private readonly logger = new Logger(ManualPaymentProvider.name);

  isAvailable(): boolean {
    return true;
  }

  async createPaymentSession(request: PaymentSessionRequest): Promise<PaymentSessionResult> {
    const manualRef = `REC-MAN-${Date.now().toString().slice(-6)}`;
    const instructions = `Paiement en agence ou remise manuelle (Espèces / Chèque). Un reçu signé vous sera remis à l'encaissement. Référence de suivi : ${manualRef}`;

    this.logger.log(
      `[Manual Payment] Enregistrement d'une promesse de paiement manuel #${request.paymentId} | Ref: ${manualRef}`,
    );

    return {
      provider: 'MANUAL',
      providerRef: manualRef,
      status: PaymentStatus.PENDING,
      instructions,
      rawResponse: {
        reference: manualRef,
        amount: request.amount,
        currency: request.currency,
      },
    };
  }

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentProcessResult> {
    const transactionRef = `rec_cash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const receiptUrl = `https://receipts.immo-mykajy.fr/manual/${transactionRef}.pdf`;

    this.logger.log(
      `[Manual Payment] Encaissement manuel validé par l'agent pour Paiement #${request.paymentId} | Reçu: ${transactionRef}`,
    );

    return {
      success: true,
      status: PaymentStatus.PAID,
      transactionRef,
      providerRef: request.providerRef || transactionRef,
      paidAt: new Date(),
      receiptUrl,
    };
  }

  async verifyPayment(providerRef: string): Promise<PaymentVerificationResult> {
    return {
      isVerified: true,
      status: PaymentStatus.PAID,
      amount: 100,
      currency: 'EUR',
      paidAt: new Date(),
      providerRef,
    };
  }

  async refundPayment(
    providerRef: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentRefundResult> {
    const refundId = `ref_man_${Date.now()}`;
    this.logger.log(`[Manual Payment] Reçu de remboursement manuel émis : ${refundId}`);
    return {
      success: true,
      refundId,
      amountRefunded: amount || 0,
      currency: 'EUR',
      refundedAt: new Date(),
    };
  }
}
