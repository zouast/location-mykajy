import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class SavedSearchResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  userId!: string;

  @ApiProperty({ example: 'Maison 4 pièces Antananarivo' })
  name!: string;

  @ApiPropertyOptional({ enum: TransactionType, example: 'SALE' })
  transactionType?: TransactionType | null;

  @ApiPropertyOptional({ example: 'Antananarivo' })
  city?: string | null;

  @ApiPropertyOptional({ example: 100000000 })
  minPrice?: number | null;

  @ApiPropertyOptional({ example: 500000000 })
  maxPrice?: number | null;

  @ApiPropertyOptional({ example: 50 })
  minArea?: number | null;

  @ApiPropertyOptional({ example: 200 })
  maxArea?: number | null;

  @ApiPropertyOptional({ example: 3 })
  minRooms?: number | null;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  propertyTypeId?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ example: '2026-09-01T12:00:00.000Z' })
  lastNotifiedAt?: Date | null;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ example: 5, description: 'Nombre d’annonces actuellement correspondantes' })
  matchedCount?: number;
}
