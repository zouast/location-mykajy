import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAgentProfileDto {
  @ApiPropertyOptional({
    description: "Titre professionnel de l'agent",
    example: 'Conseiller Immobilier Senior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: 'Numéro de carte professionnelle',
    example: 'CPI75012020000000002',
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({
    description: "Biographie et présentation de l'agent",
    example: 'Spécialiste de la vente résidentielle depuis 10 ans.',
  })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({
    description: 'Spécialités immobilières',
    type: [String],
    example: ['Appartements', 'Investissement', 'Luxe'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({
    description: "Nombre d'années d'expérience",
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @ApiPropertyOptional({
    description: 'Disponibilité pour de nouveaux mandats et visites',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
