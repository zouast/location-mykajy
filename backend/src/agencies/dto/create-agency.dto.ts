import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({
    description: "Nom commercial de l'agence",
    example: 'Immo Prestige Paris',
    maxLength: 100,
  })
  @IsNotEmpty({ message: "Le nom de l'agence est requis" })
  @IsString()
  @MaxLength(100)
  name: string;

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
    description: 'Numéro SIRET (14 chiffres)',
    example: '12345678901234',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{14}$/, {
    message: 'Le SIRET doit être composé exactement de 14 chiffres',
  })
  siret?: string;

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

  @ApiProperty({
    description: 'Adresse physique',
    example: '12 Avenue Montaigne',
  })
  @IsNotEmpty({ message: "L'adresse est requise" })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Ville',
    example: 'Paris',
  })
  @IsNotEmpty({ message: 'La ville est requise' })
  @IsString()
  city: string;

  @ApiPropertyOptional({
    description: 'Code postal',
    example: '75008',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({
    description: 'Numéro de téléphone principal',
    example: '+33140000000',
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'Le format du numéro de téléphone est invalide',
  })
  phone: string;

  @ApiProperty({
    description: 'Adresse email de contact',
    example: 'contact@immoprestige.com',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: "Format d'email invalide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @ApiPropertyOptional({
    description: 'Site web officiel',
    example: 'https://www.immoprestige.com',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;

  @ApiPropertyOptional({
    description: 'Numéro de carte professionnelle (CPI)',
    example: 'CPI75012020000000001',
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Agence vérifiée par la plateforme',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = false;

  @ApiPropertyOptional({
    description: 'Statut actif de l’agence',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
