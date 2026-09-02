import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class PropertyFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Recherche par mot-clé (titre, description, ville, code postal)',
    example: 'haussmannien',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Type de bien (nom ou slug)',
    example: 'appartement',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Statut du bien',
    enum: PropertyStatus,
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({
    description: 'Ville',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Code postal',
    example: '75008',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Surface habitable minimale en m²',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional({
    description: 'Surface habitable maximale en m²',
    example: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxArea?: number;

  @ApiPropertyOptional({
    description: 'Surface minimale du terrain en m²',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minLandArea?: number;

  @ApiPropertyOptional({
    description: 'Nombre de pièces minimum',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minRooms?: number;

  @ApiPropertyOptional({
    description: 'Nombre de chambres minimum',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBedrooms?: number;

  @ApiPropertyOptional({
    description: 'Nombre de salles de bain minimum',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBathrooms?: number;

  @ApiPropertyOptional({
    description: 'Filtrer les biens meublés',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isFurnished?: boolean;

  @ApiPropertyOptional({
    description: 'Avec ascenseur',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  hasElevator?: boolean;

  @ApiPropertyOptional({
    description: 'Avec balcon',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  hasBalcony?: boolean;

  @ApiPropertyOptional({
    description: 'Avec jardin',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  hasGarden?: boolean;

  @ApiPropertyOptional({
    description: 'Avec piscine',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  hasPool?: boolean;

  @ApiPropertyOptional({
    description: 'Avec garage',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  hasGarage?: boolean;

  @ApiPropertyOptional({
    description: 'Classe énergétique DPE',
    example: 'C',
  })
  @IsOptional()
  @IsString()
  energyRating?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par identifiant de propriétaire',
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par identifiant d’agence',
  })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par identifiant d’agent',
  })
  @IsOptional()
  @IsString()
  agentId?: string;
}
