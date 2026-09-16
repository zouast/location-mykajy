import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  PaymentType,
  PaymentMethod,
} from '../interfaces/payment-provider.interface';
import type { PaymentProviderType } from '../interfaces/payment-provider.interface';

export class InitiatePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  provider?: PaymentProviderType;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  saleId?: string;

  @IsOptional()
  @IsString()
  rentalId?: string;

  @IsOptional()
  @IsString()
  rentScheduleId?: string;

  @IsOptional()
  @IsString()
  commissionId?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
