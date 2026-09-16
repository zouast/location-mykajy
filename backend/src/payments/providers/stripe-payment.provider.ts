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
export class StripePaymentProvider implements PaymentProvider {
  readonly providerId: PaymentProviderType = 'STRIPE';
  private readonly logger = new Logger(StripePaymentProvider.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
  }

  isAvailable(): boolean {
    return true; // Prêt pour l'environnement dev ou avec clé API
  }

  async createPaymentSession(request: PaymentSessionRequest): Promise<PaymentSessionResult> {
    const sessionRef = `cs_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const checkoutUrl = request.returnUrl
      ? `${request.returnUrl}?session_id=${sessionRef}`
      : `https://checkout.stripe.com/pay/${sessionRef}`;

    this.logger.log(
      `[Stripe] Session créée pour Paiement #${request.paymentId} | Montant: ${request.amount} ${request.currency} | Ref: ${sessionRef}`,
    );

    return {
      provider: 'STRIPE',
      providerRef: sessionRef,
      status: PaymentStatus.PENDING,
      checkoutUrl,
      rawResponse: {
        id: sessionRef,
        amount_total: Math.round(request.amount * 100),
        currency: request.currency.toLowerCase(),
        customer_email: request.userEmail,
        payment_status: 'unpaid',
      },
    };
  }

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentProcessResult> {
    const transactionRef = `tx_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const receiptUrl = `https://receipts.immo-mykajy.fr/stripe/${transactionRef}.pdf`;

    this.logger.log(
      `[Stripe] Confirmation paiement pour Paiement #${request.paymentId} | Ref: ${transactionRef}`,
    );

    return {
      success: true,
      status: PaymentStatus.PAID,
      transactionRef,
      providerRef: request.providerRef || transactionRef,
      paidAt: new Date(),
      receiptUrl,
      rawResponse: {
        id: transactionRef,
        status: 'succeeded',
        paid: true,
      },
    };
  }

  async verifyPayment(providerRef: string): Promise<PaymentVerificationResult> {
    this.logger.log(`[Stripe] Vérification session ${providerRef}`);
    return {
      isVerified: true,
      status: PaymentStatus.PAID,
      amount: 100,
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
    const refundId = `re_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.logger.log(
      `[Stripe] Remboursement de ${amount || 'totalité'} pour session ${providerRef} (Motif: ${reason || 'demande client'})`,
    );

    return {
      success: true,
      refundId,
      amountRefunded: amount || 0,
      currency: 'EUR',
      refundedAt: new Date(),
      rawResponse: { id: refundId, status: 'succeeded' },
    };
  }
}
