import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';

export class MediaResponseDto {
  @ApiProperty({ example: 'abc-uuid-123' })
  id!: string;

  @ApiProperty({ example: 'property-uuid-456' })
  propertyId!: string;

  @ApiProperty({
    description: 'URL publique du fichier (S3, CDN, ou stockage local)',
    example: 'https://cdn.immo-mykajy.com/properties/photos/1234-salon.jpg',
  })
  url!: string;

  @ApiProperty({ enum: MediaType, example: MediaType.IMAGE })
  type!: MediaType;

  @ApiPropertyOptional({ example: 'Salon lumineux' })
  title?: string;

  @ApiPropertyOptional({ example: 'Vue depuis la fenêtre principale' })
  description?: string;

  @ApiProperty({ description: 'Photo principale du bien', example: false })
  isPrimary!: boolean;

  @ApiProperty({ description: "Ordre d'affichage", example: 0 })
  sortOrder!: number;

  @ApiProperty()
  createdAt!: Date;
}
