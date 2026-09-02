import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { InquiryStatus } from '@prisma/client';

export class UpdateInquiryStatusDto {
  @ApiProperty({
    enum: InquiryStatus,
    example: InquiryStatus.IN_PROGRESS,
    description: 'Nouveau statut de la demande',
  })
  @IsEnum(InquiryStatus, { message: 'Statut de demande invalide' })
  @IsNotEmpty({ message: 'Le statut est obligatoire' })
  status!: InquiryStatus;

  @ApiPropertyOptional({
    example: 'Message reçu, je vous contacte par téléphone ce jour.',
    description: 'Réponse textuelle de l’agent/propriétaire',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  response?: string;
}
