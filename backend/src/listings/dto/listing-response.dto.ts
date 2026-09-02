import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ListingStatus,
  ListingVisibility,
  TransactionType,
} from '@prisma/client';

export class ListingPriceResponseDto {
  @ApiProperty({ example: 1850 })
  price!: number;

  @ApiPropertyOptional({ example: 19.47 })
  pricePerSqm?: number;

  @ApiProperty({ example: 'EUR' })
  currency!: string;

  @ApiPropertyOptional({ example: false })
  isNegotiable?: boolean;

  @ApiPropertyOptional({ example: 3700 })
  deposit?: number;

  @ApiPropertyOptional({ example: 1200 })
  agencyFees?: number;

  @ApiPropertyOptional({ example: 120 })
  charges?: number;

  @ApiPropertyOptional({ example: false })
  chargesIncluded?: boolean;

  @ApiPropertyOptional({ description: 'Frais de notaire estimés (vente)' })
  notaryFees?: number;

  @ApiPropertyOptional({ description: 'Taxe foncière annuelle (vente)' })
  taxeFonciere?: number;
}

export class ListingResponseDto {
  @ApiProperty({ example: 'listing-uuid-123' })
  id!: string;

  @ApiProperty({ example: 'property-uuid-456' })
  propertyId!: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.RENT })
  transactionType!: TransactionType;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @ApiProperty({ enum: ListingVisibility, example: ListingVisibility.PUBLIC })
  visibility!: ListingVisibility;

  @ApiPropertyOptional({ example: 'Bel appartement 4 pièces — Paris 18e' })
  title?: string;

  @ApiPropertyOptional({ example: 'Superbe appartement lumineux...' })
  description?: string;

  @ApiPropertyOptional({ example: 'bel-appartement-4-pieces-paris-18e' })
  slug?: string;

  @ApiProperty({ example: 0 })
  viewsCount!: number;

  @ApiProperty({ example: false })
  isFeatured!: boolean;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: ListingPriceResponseDto })
  price?: ListingPriceResponseDto;
}

export class PaginatedListingsResponseDto {
  @ApiProperty({ type: [ListingResponseDto] })
  items!: ListingResponseDto[];

  @ApiProperty()
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
