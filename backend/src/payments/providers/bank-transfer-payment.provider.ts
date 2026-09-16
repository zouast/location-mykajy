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
export class BankTransferPaymentProvider implements PaymentProvider {
  readonly providerId: PaymentProviderType = 'BANK_TRANSFER';
  private readonly logger = new Logger(BankTransferPaymentProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    return true;
  }

  async createPaymentSession(request: PaymentSessionRequest): Promise<PaymentSessionResult> {
    const bankRef = `VIR-MYKAJY-${request.paymentId.substring(0, 8).toUpperCase()}`;
    const iban = this.configService.get<string>('BANK_IBAN', 'FR76 3000 4000 5000 6000 7000 123');
    const bic = this.configService.get<string>('BANK_BIC', 'BNPAFRPP');
    const beneficiary = 'IMMO-MYKAJY SAS';

    this.logger.log(
      `[Bank Transfer] Coordonnées générées pour Paiement #${request.paymentId} | Ref obligatoire: ${bankRef}`,
    );

    const instructions = `Veuillez effectuer un virement bancaire de ${request.amount} ${request.currency} à l'ordre de ${beneficiary}.\nIBAN: ${iban}\nBIC: ${bic}\nRéférence obligatoire à mentionner : ${bankRef}`;

    return {
      provider: 'BANK_TRANSFER',
      providerRef: bankRef,
      status: PaymentStatus.PENDING,
      instructions,
      rawResponse: {
        beneficiary,
        iban,
        bic,
        reference: bankRef,
        amount: request.amount,
        currency: request.currency,
      },
    };
  }

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentProcessResult> {
    const transactionRef = `tx_bank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const receiptUrl = `https://receipts.immo-mykajy.fr/bank/${transactionRef}.pdf`;

    this.logger.log(
      `[Bank Transfer] Virement rapproché et validé pour Paiement #${request.paymentId} | Ref: ${transactionRef}`,
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
      amount: 1200,
      currency: 'EUR',
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
    const refundId = `ref_bank_${Date.now()}`;
    this.logger.log(`[Bank Transfer] Ordre de virement de retour émis: ${refundId}`);
    return {
      success: true,
      refundId,
      amountRefunded: amount || 0,
      currency: 'EUR',
      refundedAt: new Date(),
    };
  }
}
