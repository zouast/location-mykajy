import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({
    description: 'Adresse email',
    example: 'nouveau.email@example.com',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Format d’email invalide' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Prénom',
    example: 'Alice',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Nom de famille',
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
    description: 'Genre',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'URL de l’avatar',
    example: 'https://images.example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Rôle de l’utilisateur',
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Statut actif du compte',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Statut vérifié de l’adresse email',
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
