import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString, IsOptional, IsISO8601, IsInt, Min } from 'class-validator';
import { VisitType } from '@prisma/client';

export class CreateVisitDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID de l’annonce' })
  @IsUUID('4')
  @IsNotEmpty()
  listingId!: string;

  @ApiProperty({ example: '2026-09-10T14:30:00.000Z', description: 'Date et heure souhaitées (ISO8601)' })
  @IsISO8601()
  @IsNotEmpty()
  scheduledAt!: string;

  @ApiPropertyOptional({ example: 30, description: 'Durée en minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  duration?: number;

  @ApiPropertyOptional({ example: VisitType.IN_PERSON })
  @IsOptional()
  type?: VisitType;

  @ApiPropertyOptional({ example: 'Je suis disponible après 18h' })
  @IsOptional()
  @IsString()
  clientNotes?: string;

  @ApiPropertyOptional({ example: 'agent-id-uuid', description: 'ID de l’agent assigné (optionnel)' })
  @IsOptional()
  @IsUUID('4')
  agentId?: string;
}
