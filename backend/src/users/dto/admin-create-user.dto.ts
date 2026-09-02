import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminCreateUserDto {
  @ApiProperty({
    description: 'Adresse email',
    example: 'nouvel.utilisateur@example.com',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Format d’email invalide' })
  @IsNotEmpty({ message: 'L’email est requis' })
  email: string;

  @ApiProperty({
    description: 'Mot de passe temporaire ou initial',
    example: 'MotDePasse123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit comporter au moins 8 caractères',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Prénom de l’utilisateur',
    example: 'Alice',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Nom de famille de l’utilisateur',
    example: 'Martin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '+33612345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'Le format du numéro de téléphone est invalide',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Genre de l’utilisateur',
    enum: Gender,
    example: Gender.FEMALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'URL de la photo de profil',
    example: 'https://images.example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Rôle attribué à l’utilisateur',
    enum: Role,
    default: Role.CLIENT,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.CLIENT;

  @ApiPropertyOptional({
    description: 'Statut du compte utilisateur',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Marquer l’email comme vérifié dès la création',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = false;
}
