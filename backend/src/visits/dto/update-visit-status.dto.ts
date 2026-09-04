import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class UpdateVisitStatusDto {
  @ApiProperty({
    enum: VisitStatus,
    example: VisitStatus.CONFIRMED,
    description: 'Nouveau statut de la visite (REQUESTED, CONFIRMED, COMPLETED, CANCELLED, REJECTED)',
  })
  @IsEnum(VisitStatus, { message: 'Statut de visite invalide' })
  @IsNotEmpty({ message: 'Le statut est obligatoire' })
  status!: VisitStatus;

  @ApiPropertyOptional({
    example: 'Rendez-vous confirmé sur place. Code d’accès au portail : 4589B.',
    description: 'Notes d’organisation de l’agent',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  agentNotes?: string;

  @ApiPropertyOptional({
    example: 'Indisponibilité imprévue du propriétaire ce créneau.',
    description: 'Motif en cas d’annulation ou de refus',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancelReason?: string;
}
