import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class DeactivateAccountDto {
  @ApiProperty({
    description:
      'Mot de passe actuel pour confirmer la désactivation du compte',
    example: 'SecretPassword123!',
  })
  @IsNotEmpty({ message: 'Le mot de passe de confirmation est requis' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Raison facultative de la désactivation',
    example: 'Je n’utilise plus la plateforme',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
