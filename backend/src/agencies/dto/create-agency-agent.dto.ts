import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAgencyAgentDto {
  @ApiProperty({
    description: "Adresse email de l'agent",
    example: 'agent.dupont@immoprestige.com',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: "Format d'email invalide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @ApiProperty({
    description: "Mot de passe temporaire pour l'agent",
    example: 'MotDePasseAgent123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit comporter au moins 8 caractères',
  })
  password: string;

  @ApiProperty({
    description: "Prénom de l'agent",
    example: 'Lucas',
  })
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: "Nom de famille de l'agent",
    example: 'Bernard',
  })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone direct',
    example: '+33612345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'Le format du numéro de téléphone est invalide',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Genre',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: "Titre ou poste de l'agent",
    example: 'Conseiller immobilier senior',
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
    example: 'Plus de 10 ans d’expérience dans le triangle d’or parisien.',
  })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({
    description: 'Spécialités immobilières',
    example: ['Luxe', 'Haussmannien', 'Investissement'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({
    description: "Nombre d'années d'expérience",
    example: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience?: number;
}
