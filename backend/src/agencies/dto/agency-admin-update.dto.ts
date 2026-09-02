import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class AgencyAdminUpdateAgencyDto {
  @ApiPropertyOptional({
    description: "Nom commercial de l'agence",
    example: 'Immo Prestige Paris',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Raison sociale',
    example: 'Immo Prestige SAS',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  legalName?: string;

  @ApiPropertyOptional({
    description: "URL du logo de l'agence",
    example: 'https://images.example.com/agencies/logo-prestige.png',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL de la bannière',
    example: 'https://images.example.com/agencies/banner-prestige.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: "Description et présentation de l'agence",
    example: "Agence spécialisée dans l'immobilier haut de gamme à Paris.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Adresse physique',
    example: '12 Avenue Montaigne',
  })
  @IsOptional()
  @IsString()
  address?: string;

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
    description: 'Numéro de téléphone principal',
    example: '+33140000000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'Le format du numéro de téléphone est invalide',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Adresse email de contact',
    example: 'contact@immoprestige.com',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: "Format d'email invalide" })
  email?: string;

  @ApiPropertyOptional({
    description: 'Site web officiel',
    example: 'https://www.immoprestige.com',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;
}
