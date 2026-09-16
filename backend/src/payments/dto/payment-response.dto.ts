import {
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  PaymentProviderType,
} from '../interfaces/payment-provider.interface';

export interface PaymentItemDto {
  id: string;
  userId: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  provider?: string | null;
  providerRef?: string | null;
  transactionRef?: string | null;
  description: string;
  dueDate: Date;
  paidAt?: Date | null;
  failedReason?: string | null;
  receiptUrl?: string | null;
  saleId?: string | null;
  rentalId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  rental?: {
    id: string;
    monthlyRent: number;
    listing?: { id: string; title?: string | null } | null;
  } | null;
  sale?: {
    id: string;
    offerPrice: number;
    listing?: { id: string; title?: string | null } | null;
  } | null;
}

export interface PaymentSessionResponseDto {
  payment: PaymentItemDto;
  session: {
    provider: PaymentProviderType;
    providerRef: string;
    status: PaymentStatus;
    checkoutUrl?: string;
    qrCodeUrl?: string;
    ussdPromptCode?: string;
    instructions?: string;
  };
}
