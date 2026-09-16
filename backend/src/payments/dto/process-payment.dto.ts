import { IsOptional, IsString, IsNumber } from 'class-validator';

export class ProcessPaymentDto {
  @IsOptional()
  @IsString()
  providerRef?: string;

  @IsOptional()
  @IsString()
  otpCode?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class RefundPaymentDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
