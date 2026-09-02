import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO pour les actions de workflow nécessitant une raison ou un commentaire.
 * Utilisé par : rejection, suspension, archivage.
 */
export class ListingActionDto {
  @ApiPropertyOptional({
    description:
      "Raison ou commentaire de l'action (optionnel mais recommandé)",
    example: 'Prix incorrect ou description incomplète',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
