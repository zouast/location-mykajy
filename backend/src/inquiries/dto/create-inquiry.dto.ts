import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID de l’annonce concernée',
  })
  @IsUUID('4', { message: 'ID d’annonce invalide' })
  @IsNotEmpty({ message: 'L’ID de l’annonce est obligatoire' })
  listingId!: string;

  @ApiProperty({
    example: 'Demande de visite et informations complémentaires',
    description: 'Objet / Sujet du message',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le sujet est obligatoire' })
  @MinLength(3, { message: 'Le sujet doit comporter au moins 3 caractères' })
  @MaxLength(150, { message: 'Le sujet ne peut dépasser 150 caractères' })
  subject!: string;

  @ApiProperty({
    example: 'Bonjour, je souhaiterais visiter ce bien ce vendredi après-midi. Êtes-vous disponible ?',
    description: 'Corps du message',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut être vide' })
  @MinLength(10, { message: 'Le message doit comporter au moins 10 caractères' })
  @MaxLength(2000, { message: 'Le message ne peut dépasser 2000 caractères' })
  message!: string;

  @ApiPropertyOptional({ example: 'Jean Dupont' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'jean.dupont@exemple.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide' })
  email?: string;

  @ApiPropertyOptional({ example: '+261 34 00 000 00' })
  @IsOptional()
  @IsString()
  phone?: string;
}
