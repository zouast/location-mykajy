import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO de recherche avancée des annonces immobilières.
 *
 * Supporte tous les filtres métier du moteur de recherche :
 *  - Filtres administratifs (ville, quartier, commune)
 *  - Filtres de type et transaction
 *  - Filtres de prix et surface
 *  - Filtres de caractéristiques (chambres, pièces, salles de bain)
 *  - Filtres d'équipements (parking, piscine, jardin, meublé)
 *  - Filtres géospatiaux (rayon autour d'un point GPS)
 *  - Pagination et tri
 */
export class SearchListingsDto {
  // ─── Pagination ─────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Numéro de page (commence à 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Résultats par page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // ─── Type de transaction ─────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Type de transaction',
    enum: TransactionType,
    example: TransactionType.RENT,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  // ─── Type de bien ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description:
      'Type de bien (slug) : appartement, maison, villa, terrain, bureau…',
    example: 'appartement',
  })
  @IsOptional()
  @IsString()
  propertyType?: string;

  // ─── Localisation ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Filtrer par ville', example: 'Paris' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par quartier',
    example: 'Montmartre',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par commune',
    example: 'Paris 18e',
  })
  @IsOptional()
  @IsString()
  commune?: string;

  // ─── Prix ────────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Prix minimum (€)', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Prix maximum (€)', example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // ─── Surface ─────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Surface habitable minimale (m²)',
    example: 40,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional({
    description: 'Surface habitable maximale (m²)',
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxArea?: number;

  // ─── Pièces / Chambres / Salles de bain ─────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Nombre minimum de chambres',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBedrooms?: number;

  @ApiPropertyOptional({ description: 'Nombre minimum de pièces', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRooms?: number;

  @ApiPropertyOptional({
    description: 'Nombre minimum de salles de bain',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBathrooms?: number;

  // ─── Équipements ─────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Avec parking (places de stationnement > 0)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasParking?: boolean;

  @ApiPropertyOptional({ description: 'Avec piscine', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasPool?: boolean;

  @ApiPropertyOptional({ description: 'Avec jardin', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasGarden?: boolean;

  @ApiPropertyOptional({ description: 'Meublé', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFurnished?: boolean;

  @ApiPropertyOptional({ description: 'Avec ascenseur', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasElevator?: boolean;

  @ApiPropertyOptional({ description: 'Avec garage', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasGarage?: boolean;

  @ApiPropertyOptional({ description: 'Avec balcon', example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasBalcony?: boolean;

  // ─── Recherche Géospatiale par Rayon ─────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Latitude du point central (degrés décimaux)',
    example: 48.8566,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude du point central (degrés décimaux)',
    example: 2.3522,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    description: 'Rayon de recherche en kilomètres (nécessite lat et lng)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(500)
  radiusKm?: number;

  // ─── Tri ─────────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Champ de tri',
    enum: ['price', 'date', 'area', 'relevance'],
    example: 'date',
    default: 'date',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'date' | 'area' | 'relevance';

  @ApiPropertyOptional({
    description: 'Direction du tri',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  // ─── Recherche textuelle libre ────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: "Recherche libre dans le titre et la description de l'annonce",
    example: 'vue mer lumineux',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
