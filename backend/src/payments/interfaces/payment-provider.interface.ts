export enum PaymentType {
  RENT = 'RENT',
  DEPOSIT = 'DEPOSIT',
  COMMISSION = 'COMMISSION',
  DOWN_PAYMENT = 'DOWN_PAYMENT',
  SALE_PAYMENT = 'SALE_PAYMENT',
  OTHER_FEES = 'OTHER_FEES',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MANUAL = 'MANUAL',
  CASH = 'CASH',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
}

export type PaymentProviderType =
  | 'STRIPE'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'MANUAL';

export interface PaymentSessionRequest {
  paymentId: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  userName?: string;
  amount: number;
  currency: string;
  type: PaymentType;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentSessionResult {
  provider: PaymentProviderType;
  providerRef: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  qrCodeUrl?: string;
  ussdPromptCode?: string;
  instructions?: string;
  rawResponse?: any;
}

export interface ProcessPaymentRequest {
  paymentId: string;
  providerRef?: string;
  otpCode?: string;
  phoneNumber?: string;
  metadata?: Record<string, any>;
}

export interface PaymentProcessResult {
  success: boolean;
  status: PaymentStatus;
  transactionRef: string;
  providerRef?: string;
  paidAt?: Date;
  receiptUrl?: string;
  error?: string;
  rawResponse?: any;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt?: Date;
  transactionRef?: string;
  providerRef?: string;
  rawResponse?: any;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId: string;
  amountRefunded: number;
  currency: string;
  refundedAt: Date;
  error?: string;
  rawResponse?: any;
}

export interface PaymentProvider {
  readonly providerId: PaymentProviderType;

  /**
   * Crée une session ou intention de paiement auprès du fournisseur
   */
  createPaymentSession(
    request: PaymentSessionRequest,
  ): Promise<PaymentSessionResult>;

  /**
   * Exécute ou confirme un paiement
   */
  processPayment(
    request: ProcessPaymentRequest,
  ): Promise<PaymentProcessResult>;

  /**
   * Vérifie le statut d'une transaction
   */
  verifyPayment(
    providerRef: string,
  ): Promise<PaymentVerificationResult>;

  /**
   * Rembourse une transaction
   */
  refundPayment(
    providerRef: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentRefundResult>;

  /**
   * Indique si le fournisseur est disponible et configuré
   */
  isAvailable(): boolean;
}
