import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationResponseDto {
  @ApiProperty({ example: 'abc-uuid-123' })
  id!: string;

  @ApiProperty({ example: '15 Boulevard Saint-Germain' })
  address!: string;

  @ApiPropertyOptional({ example: 'Bâtiment B, 3ème étage' })
  complement?: string;

  @ApiProperty({ example: 'Paris' })
  city!: string;

  @ApiPropertyOptional({ example: 'Île-de-France' })
  state?: string;

  @ApiProperty({ example: '75005' })
  zipCode!: string;

  @ApiProperty({ example: 'France' })
  country!: string;

  @ApiPropertyOptional({ example: 48.8534 })
  latitude?: number;

  @ApiPropertyOptional({ example: 2.3488 })
  longitude?: number;

  @ApiPropertyOptional({ example: 'Saint-Germain-des-Prés' })
  neighborhood?: string;
}

export class LocationWithDistanceDto extends LocationResponseDto {
  @ApiPropertyOptional({
    description: 'Distance depuis le point de recherche en kilomètres',
    example: 1.23,
  })
  distanceKm?: number;
}

export class GeoJsonPointPropertiesDto {
  @ApiProperty({ example: 'abc-uuid-123' })
  id!: string;

  @ApiProperty({ example: 'Appartement Montmartre' })
  title?: string;

  @ApiProperty({ example: 'Paris' })
  city!: string;

  @ApiPropertyOptional({ example: 'Montmartre' })
  neighborhood?: string;

  @ApiPropertyOptional({ example: 75018 })
  zipCode?: string;
}

export class GeoJsonFeatureDto {
  @ApiProperty({ example: 'Feature' })
  type!: 'Feature';

  @ApiProperty({ description: 'GeoJSON Point geometry' })
  geometry!: {
    type: 'Point';
    coordinates: [number, number];
  };

  @ApiProperty({ type: GeoJsonPointPropertiesDto })
  properties!: GeoJsonPointPropertiesDto;
}

export class GeoJsonFeatureCollectionDto {
  @ApiProperty({ example: 'FeatureCollection' })
  type!: 'FeatureCollection';

  @ApiProperty({ type: [GeoJsonFeatureDto] })
  features!: GeoJsonFeatureDto[];
}

export class LocationSuggestionDto {
  @ApiProperty({ example: 'abc-uuid-123' })
  id!: string;

  @ApiProperty({ example: 'Montmartre, Paris 18e, 75018' })
  label!: string;

  @ApiPropertyOptional({ example: 48.8867 })
  latitude?: number;

  @ApiPropertyOptional({ example: 2.3431 })
  longitude?: number;
}
