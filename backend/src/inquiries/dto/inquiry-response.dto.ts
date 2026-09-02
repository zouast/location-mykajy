import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryStatus } from '@prisma/client';

export class InquiryUserDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'client@exemple.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Jean' })
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Dupont' })
  lastName?: string | null;

  @ApiPropertyOptional({ example: '+261 34 00 000 00' })
  phone?: string | null;
}

export class InquiryListingDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'Villa 5 pièces vue panoramique' })
  title!: string;

  @ApiProperty({ example: 'SALE' })
  transactionType!: string;

  @ApiPropertyOptional({ example: 'Antananarivo' })
  city?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1' })
  primaryPhotoUrl?: string;

  @ApiPropertyOptional({ example: 450000 })
  price?: number;
}

export class InquiryResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  listingId!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  clientId?: string | null;

  @ApiPropertyOptional({ example: 'Jean Dupont' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'jean.dupont@exemple.com' })
  email?: string | null;

  @ApiPropertyOptional({ example: '+261 34 00 000 00' })
  phone?: string | null;

  @ApiProperty({ example: 'Demande de visite' })
  subject!: string;

  @ApiProperty({ example: 'Bonjour, ce bien est-il toujours disponible ?' })
  message!: string;

  @ApiProperty({ enum: InquiryStatus, example: InquiryStatus.NEW })
  status!: InquiryStatus;

  @ApiPropertyOptional({ example: 'Oui, toujours disponible.' })
  response?: string | null;

  @ApiPropertyOptional({ example: '2026-09-01T14:00:00.000Z' })
  respondedAt?: Date | null;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: InquiryUserDto })
  client?: InquiryUserDto | null;

  @ApiPropertyOptional({ type: InquiryListingDto })
  listing?: InquiryListingDto | null;
}
