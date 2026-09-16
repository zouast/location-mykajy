import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';
import { Match } from '../decorators/match.decorator';

export const ALLOWED_REGISTER_ROLES = [
  Role.LOCATAIRE,
  Role.PROPRIETAIRE,
] as const;

export class RegisterDto {
  @ApiProperty({ example: 'Jean' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Le prénom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le prénom est obligatoire.' })
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  lastName: string;

  @ApiProperty({ example: 'jean.dupont@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide.' })
  @IsNotEmpty({ message: 'L’adresse email est obligatoire.' })
  email: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'Le numéro de téléphone doit être une chaîne.' })
  phone?: string;

  @ApiProperty({
    example: 'MotDePasse123!',
    minLength: 8,
    description: 'Mot de passe sécurisé',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  @MinLength(8, {
    message: 'Le mot de passe doit comporter au moins 8 caractères.',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.',
  })
  password: string;

  @ApiProperty({
    example: 'MotDePasse123!',
    description: 'Confirmation identique au mot de passe',
  })
  @IsString({ message: 'La confirmation du mot de passe doit être une chaîne.' })
  @IsNotEmpty({ message: 'La confirmation du mot de passe est obligatoire.' })
  @Match('password', {
    message: 'La confirmation doit être identique au mot de passe.',
  })
  passwordConfirmation: string;

  @ApiProperty({
    example: Role.LOCATAIRE,
    enum: [Role.LOCATAIRE, Role.PROPRIETAIRE],
    description: 'Rôle sélectionné pour l’inscription (LOCATAIRE ou PROPRIETAIRE)',
  })
  @IsNotEmpty({ message: 'Le rôle est obligatoire.' })
  @IsIn([Role.LOCATAIRE, Role.PROPRIETAIRE], {
    message:
      'Le rôle sélectionné n’est pas autorisé pour l’inscription publique. Seuls LOCATAIRE et PROPRIETAIRE sont acceptés.',
  })
  role: Role;

  @ApiProperty({
    example: true,
    description: 'Acceptation obligatoire des conditions générales',
  })
  @IsBoolean({
    message: 'L’acceptation des conditions doit être un booléen.',
  })
  @Equals(true, {
    message: 'Vous devez obligatoirement accepter les conditions générales.',
  })
  acceptTerms: boolean;
}
