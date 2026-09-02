import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AdminUpdateUserStatusDto {
  @ApiProperty({
    description: 'Nouveau statut actif/inactif du compte',
    example: false,
  })
  @IsNotEmpty({ message: 'Le statut isActive est requis' })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Raison administrative de l’action',
    example: 'Suspension temporaire suite à signalement',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
