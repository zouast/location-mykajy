import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType, PropertyStatus } from '@prisma/client';
import { PaginationMetaDto } from '../../users/dto/user-response.dto';

export class LocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional()
  complement?: string | null;

  @ApiProperty()
  city: string;

  @ApiPropertyOptional()
  state?: string | null;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  country: string;

  @ApiPropertyOptional()
  latitude?: number | null;

  @ApiPropertyOptional()
  longitude?: number | null;

  @ApiPropertyOptional()
  neighborhood?: string | null;
}

export class PropertyTypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  icon?: string | null;

  @ApiPropertyOptional()
  description?: string | null;
}

export class PropertyFeatureResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiPropertyOptional()
  value?: string | null;
}

export class PropertyMediaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ enum: MediaType })
  type: MediaType;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  sortOrder: number;
}

export class PropertyResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Superbe appartement haussmannien 4 pièces' })
  title: string;

  @ApiProperty({ example: 'Magnifique appartement situé...' })
  description: string;

  @ApiProperty({ enum: PropertyStatus, example: PropertyStatus.AVAILABLE })
  status: PropertyStatus;

  @ApiProperty({ example: 95.5 })
  area: number;

  @ApiPropertyOptional({ example: 0 })
  landArea?: number | null;

  @ApiPropertyOptional({ example: 4 })
  rooms?: number | null;

  @ApiPropertyOptional({ example: 2 })
  bedrooms?: number | null;

  @ApiPropertyOptional({ example: 1 })
  bathrooms?: number | null;

  @ApiPropertyOptional({ example: 1910 })
  yearBuilt?: number | null;

  @ApiPropertyOptional({ example: 3 })
  floor?: number | null;

  @ApiPropertyOptional({ example: 6 })
  totalFloors?: number | null;

  @ApiPropertyOptional({ example: 1 })
  parkingSpaces?: number | null;

  @ApiPropertyOptional({ example: 'C' })
  energyRating?: string | null;

  @ApiPropertyOptional({ example: 'C' })
  ghgRating?: string | null;

  @ApiProperty({ example: false })
  isFurnished: boolean;

  @ApiProperty({ example: true })
  hasElevator: boolean;

  @ApiProperty({ example: true })
  hasBalcony: boolean;

  @ApiProperty({ example: false })
  hasGarden: boolean;

  @ApiProperty({ example: false })
  hasPool: boolean;

  @ApiProperty({ example: false })
  hasGarage: boolean;

  @ApiProperty({ example: '2026-09-01T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-01T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date | null;

  @ApiProperty({ type: () => PropertyTypeResponseDto })
  type: PropertyTypeResponseDto;

  @ApiProperty({ type: () => LocationResponseDto })
  location: LocationResponseDto;

  @ApiPropertyOptional({ type: () => [PropertyFeatureResponseDto] })
  features?: PropertyFeatureResponseDto[];

  @ApiPropertyOptional({ type: () => [PropertyMediaResponseDto] })
  media?: PropertyMediaResponseDto[];

  @ApiPropertyOptional()
  ownerId?: string | null;

  @ApiPropertyOptional()
  agencyId?: string | null;

  @ApiPropertyOptional()
  agentId?: string | null;
}

export class PaginatedPropertiesResponseDto {
  @ApiProperty({ type: [PropertyResponseDto] })
  items: PropertyResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
