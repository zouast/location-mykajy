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

export class UpdateAgencyAgentDto {
  @ApiPropertyOptional({
    description: "Titre ou poste de l'agent",
    example: 'Directeur des ventes',
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
    description: 'Biographie ou présentation',
  })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({
    description: 'Spécialités immobilières',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({
    description: "Nombre d'années d'expérience",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @ApiPropertyOptional({
    description: "Disponibilité de l'agent pour de nouveaux mandats/visites",
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
