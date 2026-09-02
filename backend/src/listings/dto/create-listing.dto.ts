import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, ListingVisibility } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO de création d'une annonce immobilière (Listing).
 *
 * Une annonce est l'aspect commercial d'un bien physique (Property).
 * Toute annonce démarre en DRAFT — le workflow de publication doit être suivi.
 */
export class CreateListingDto {
  @ApiProperty({
    description: "Identifiant du bien immobilier physique rattaché à l'annonce",
    example: 'property-uuid-123',
  })
  @IsString()
  propertyId!: string;

  @ApiProperty({
    description: 'Type de transaction : SALE (vente) ou RENT (location)',
    enum: TransactionType,
    example: TransactionType.RENT,
  })
  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @ApiPropertyOptional({
    description: "Titre de l'annonce (si non fourni, hérité du titre du bien)",
    example: 'Bel appartement 4 pièces — Paris 18e, vue dégagée',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: "Description commerciale de l'annonce",
    example: 'Superbe appartement lumineux au cœur de Montmartre...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Prix de vente ou loyer mensuel en devise locale',
    example: 1850,
  })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional({
    description: 'Devise (code ISO 4217)',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'EUR';

  @ApiPropertyOptional({
    description: 'Charges mensuelles (en €, pour les locations)',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  charges?: number;

  @ApiPropertyOptional({
    description: 'Dépôt de garantie (en €, pour les locations)',
    example: 3700,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  deposit?: number;

  @ApiPropertyOptional({
    description: "Honoraires d'agence (en €)",
    example: 1200,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  agencyFees?: number;

  @ApiPropertyOptional({
    description: 'Prix est négociable',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiPropertyOptional({
    description: 'Annonce mise en avant (isFeatured premium)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: "Visibilité de l'annonce",
    enum: ListingVisibility,
    example: ListingVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ListingVisibility)
  visibility?: ListingVisibility;

  @ApiPropertyOptional({
    description: "Date d'expiration automatique de l'annonce (ISO 8601)",
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
