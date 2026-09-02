import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, MediaType, TransactionType } from '@prisma/client';

// ─── Sous-objets imbriqués ────────────────────────────────────────────────────

export class SearchResultLocationDto {
  @ApiProperty({ example: 'Paris' })
  city!: string;

  @ApiPropertyOptional({ example: 'Montmartre' })
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Île-de-France' })
  state?: string;

  @ApiProperty({ example: '75018' })
  zipCode!: string;

  @ApiProperty({ example: 'France' })
  country!: string;

  @ApiPropertyOptional({ example: 48.8867 })
  latitude?: number;

  @ApiPropertyOptional({ example: 2.3431 })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Adresse complète formatée (pour affichage UI)',
    example: '10 Rue des Abbesses, Montmartre, Paris 75018',
  })
  formatted?: string;
}

export class SearchResultPriceDto {
  @ApiProperty({ example: 1850 })
  price!: number;

  @ApiProperty({ example: 'EUR' })
  currency!: string;

  @ApiPropertyOptional({
    example: '1 850 €/mois',
    description: "Prix formaté pour l'affichage",
  })
  formatted?: string;

  @ApiPropertyOptional({ example: 19.47, description: 'Prix au m²' })
  pricePerSqm?: number;

  @ApiPropertyOptional({ example: '19,47 €/m²' })
  pricePerSqmFormatted?: string;

  @ApiPropertyOptional({ example: false })
  isNegotiable?: boolean;

  @ApiPropertyOptional({ example: 120, description: 'Charges mensuelles (€)' })
  charges?: number;

  @ApiPropertyOptional({ example: 3700, description: 'Dépôt de garantie (€)' })
  deposit?: number;

  @ApiPropertyOptional({
    example: 1200,
    description: "Honoraires d'agence (€)",
  })
  agencyFees?: number;
}

export class SearchResultPropertyDto {
  @ApiProperty({ example: 'property-uuid-123' })
  id!: string;

  @ApiProperty({ example: 'Appartement 4 pièces — Montmartre' })
  title!: string;

  @ApiPropertyOptional({
    example: 'appartement',
    description: 'Slug du type de bien',
  })
  typeSlug?: string;

  @ApiPropertyOptional({
    example: 'Appartement',
    description: 'Nom du type de bien',
  })
  typeName?: string;

  @ApiProperty({ example: 95.5, description: 'Surface habitable (m²)' })
  area!: number;

  @ApiPropertyOptional({ example: 0, description: 'Surface terrain (m²)' })
  landArea?: number;

  @ApiPropertyOptional({ example: 4 })
  rooms?: number;

  @ApiPropertyOptional({ example: 2 })
  bedrooms?: number;

  @ApiPropertyOptional({ example: 1 })
  bathrooms?: number;

  @ApiPropertyOptional({ example: 1 })
  parkingSpaces?: number;

  @ApiPropertyOptional({ example: false })
  isFurnished?: boolean;

  @ApiPropertyOptional({ example: false })
  hasPool?: boolean;

  @ApiPropertyOptional({ example: false })
  hasGarden?: boolean;

  @ApiPropertyOptional({ example: false })
  hasElevator?: boolean;

  @ApiPropertyOptional({ example: false })
  hasGarage?: boolean;

  @ApiPropertyOptional({ example: false })
  hasBalcony?: boolean;

  @ApiPropertyOptional({ example: 'B', description: 'Classe énergétique DPE' })
  energyRating?: string;

  @ApiPropertyOptional({ example: 'A', description: 'Classe GES' })
  ghgRating?: string;
}

export class SearchResultPrimaryPhotoDto {
  @ApiProperty({
    example: 'https://cdn.example.com/properties/photos/salon.jpg',
  })
  url!: string;

  @ApiPropertyOptional({ example: 'Salon lumineux' })
  title?: string;
}

// ─── Résultat principal ───────────────────────────────────────────────────────

export class ListingSearchResultDto {
  @ApiProperty({ example: 'listing-uuid-456' })
  id!: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.RENT })
  transactionType!: TransactionType;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @ApiPropertyOptional({
    example: 'Superbe appartement 4 pièces vue dégagée',
    description: "Titre de l'annonce (ou titre du bien si non renseigné)",
  })
  title?: string;

  @ApiPropertyOptional({
    example: 'bel-appartement-4-pieces-montmartre-12345',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Extrait de la description (200 premiers caractères)',
  })
  descriptionExcerpt?: string;

  @ApiProperty({ example: false })
  isFeatured!: boolean;

  @ApiProperty({ example: 0 })
  viewsCount!: number;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({
    description:
      'Distance en km depuis le point de recherche GPS (si rayon utilisé)',
    example: 1.23,
  })
  distanceKm?: number;

  // ── Sous-objets imbriqués ─────────────────────────────────────────────────

  @ApiProperty({ type: SearchResultPriceDto })
  price!: SearchResultPriceDto;

  @ApiProperty({ type: SearchResultPropertyDto })
  property!: SearchResultPropertyDto;

  @ApiProperty({ type: SearchResultLocationDto })
  location!: SearchResultLocationDto;

  @ApiPropertyOptional({ type: SearchResultPrimaryPhotoDto })
  primaryPhoto?: SearchResultPrimaryPhotoDto;
}

// ─── Métadonnées de pagination ────────────────────────────────────────────────

export class SearchPaginationMetaDto {
  @ApiProperty({
    example: 142,
    description: 'Nombre total de résultats correspondants',
  })
  total!: number;

  @ApiProperty({ example: 1, description: 'Page actuelle' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Nombre de résultats par page' })
  limit!: number;

  @ApiProperty({ example: 8, description: 'Nombre total de pages' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Page suivante disponible' })
  hasNextPage!: boolean;

  @ApiProperty({ example: false, description: 'Page précédente disponible' })
  hasPreviousPage!: boolean;

  @ApiPropertyOptional({
    description:
      "Filtres actifs résumés (pour l'affichage UI du nombre de filtres)",
    example: { transactionType: 'RENT', city: 'Paris', minPrice: 500 },
  })
  appliedFilters?: Record<string, unknown>;
}

// ─── Réponse complète du moteur de recherche ─────────────────────────────────

export class ListingSearchResponseDto {
  @ApiProperty({ type: [ListingSearchResultDto] })
  items!: ListingSearchResultDto[];

  @ApiProperty({ type: SearchPaginationMetaDto })
  meta!: SearchPaginationMetaDto;
}
