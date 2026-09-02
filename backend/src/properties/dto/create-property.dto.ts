import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({
    description: 'Adresse postale',
    example: '15 Boulevard Saint-Germain',
  })
  @IsNotEmpty({ message: "L'adresse est requise" })
  @IsString()
  address: string;

  @ApiPropertyOptional({
    description: 'Complément d’adresse (bâtiment, étage, etc.)',
    example: 'Bâtiment B, Escalier 2',
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({
    description: 'Ville',
    example: 'Paris',
  })
  @IsNotEmpty({ message: 'La ville est requise' })
  @IsString()
  city: string;

  @ApiPropertyOptional({
    description: 'Région / État',
    example: 'Île-de-France',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'Code postal',
    example: '75005',
  })
  @IsNotEmpty({ message: 'Le code postal est requis' })
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({
    description: 'Pays',
    default: 'France',
    example: 'France',
  })
  @IsOptional()
  @IsString()
  country?: string = 'France';

  @ApiPropertyOptional({
    description: 'Latitude GPS',
    example: 48.8512,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude GPS',
    example: 2.3501,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Quartier',
    example: 'Quartier Latin',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;
}

export class CreatePropertyFeatureDto {
  @ApiProperty({
    description: 'Nom de la caractéristique',
    example: 'Climatisation',
  })
  @IsNotEmpty({ message: 'Le nom de la caractéristique est requis' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Catégorie (Confort, Sécurité, Extérieur, etc.)',
    example: 'Confort',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Valeur (Oui, 2 places, etc.)',
    example: 'Réversible',
  })
  @IsOptional()
  @IsString()
  value?: string;
}

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Titre du bien immobilier',
    example: 'Superbe appartement haussmannien 4 pièces',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Le titre est requis' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Description détaillée du bien',
    example: 'Magnifique appartement situé au 3ème étage avec balcon filant...',
  })
  @IsNotEmpty({ message: 'La description est requise' })
  @IsString()
  description: string;

  @ApiProperty({
    description:
      'Type de bien (nom ou slug : appartement, maison, villa, studio, terrain, bureau, local commercial, entrepôt, immeuble, parking, garage, hôtel, autre)',
    example: 'appartement',
  })
  @IsNotEmpty({ message: 'Le type de bien est requis' })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Statut du bien',
    enum: PropertyStatus,
    default: PropertyStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus = PropertyStatus.AVAILABLE;

  @ApiProperty({
    description: 'Surface habitable en m²',
    example: 95.5,
  })
  @IsNotEmpty({ message: 'La surface est requise' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'La surface doit être supérieure à 0' })
  area: number;

  @ApiPropertyOptional({
    description: 'Surface du terrain en m²',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  landArea?: number;

  @ApiPropertyOptional({
    description: 'Nombre total de pièces',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rooms?: number;

  @ApiPropertyOptional({
    description: 'Nombre de chambres',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Nombre de salles de bain / d’eau',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({
    description: 'Année de construction',
    example: 1910,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1800)
  yearBuilt?: number;

  @ApiPropertyOptional({
    description: 'Étage du bien',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiPropertyOptional({
    description: 'Nombre total d’étages de l’immeuble',
    example: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalFloors?: number;

  @ApiPropertyOptional({
    description: 'Nombre de places de stationnement / parking',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parkingSpaces?: number;

  @ApiPropertyOptional({
    description: 'Classe DPE (A à G)',
    example: 'C',
  })
  @IsOptional()
  @IsString()
  energyRating?: string;

  @ApiPropertyOptional({
    description: 'Classe GES (A à G)',
    example: 'C',
  })
  @IsOptional()
  @IsString()
  ghgRating?: string;

  @ApiPropertyOptional({
    description: 'Bien loué ou vendu meublé',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFurnished?: boolean = false;

  @ApiPropertyOptional({
    description: 'Présence d’un ascenseur',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasElevator?: boolean = false;

  @ApiPropertyOptional({
    description: 'Présence d’un balcon',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasBalcony?: boolean = false;

  @ApiPropertyOptional({
    description: 'Présence d’un jardin',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasGarden?: boolean = false;

  @ApiPropertyOptional({
    description: 'Présence d’une piscine',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasPool?: boolean = false;

  @ApiPropertyOptional({
    description: 'Présence d’un garage',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasGarage?: boolean = false;

  @ApiProperty({
    description: 'Localisation géographique du bien',
    type: () => CreateLocationDto,
  })
  @IsNotEmpty({ message: 'La localisation est requise' })
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location: CreateLocationDto;

  @ApiPropertyOptional({
    description: 'Caractéristiques et équipements supplémentaires',
    type: [CreatePropertyFeatureDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyFeatureDto)
  features?: CreatePropertyFeatureDto[];

  @ApiPropertyOptional({
    description: 'Identifiant du propriétaire (réservé ADMIN ou assignation)',
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Identifiant de l’agence en charge du bien',
  })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({
    description: 'Identifiant de l’agent affecté au bien',
  })
  @IsOptional()
  @IsString()
  agentId?: string;
}
