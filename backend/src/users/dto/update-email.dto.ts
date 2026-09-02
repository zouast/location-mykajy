import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({
    description: 'Nouvelle adresse email',
    example: 'nouveau.email@example.com',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Format d’email invalide' })
  @IsNotEmpty({ message: 'Le nouvel email est requis' })
  newEmail: string;

  @ApiProperty({
    description: 'Mot de passe actuel pour confirmer le changement',
    example: 'SecretPassword123!',
  })
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis' })
  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit comporter au moins 6 caractères',
  })
  currentPassword: string;
}
