import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { VisitType } from '@prisma/client';

export class CreateVisitDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID de l’annonce à visiter',
  })
  @IsUUID('4', { message: 'ID d’annonce invalide' })
  @IsNotEmpty({ message: 'L’ID de l’annonce est obligatoire' })
  listingId!: string;

  @ApiProperty({
    example: '2026-09-10T14:30:00.000Z',
    description: 'Date et heure prévues de la visite au format ISO 8601',
  })
  @IsDateString({}, { message: 'Date et heure de visite invalides' })
  @IsNotEmpty({ message: 'La date et l’heure de la visite sont obligatoires' })
  scheduledAt!: string;

  @ApiPropertyOptional({
    example: 45,
    default: 45,
    description: 'Durée estimée de la visite en minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({
    enum: VisitType,
    example: VisitType.IN_PERSON,
    default: VisitType.IN_PERSON,
    description: 'Visite en personne ou virtuelle en visio',
  })
  @IsOptional()
  @IsEnum(VisitType, { message: 'Type de visite invalide' })
  type?: VisitType;

  @ApiPropertyOptional({
    example: 'Je serai accompagné de mon architecte. Merci de prévoir l’accès aux combles.',
    description: 'Commentaire ou consigne du client',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  clientNotes?: string;
}
