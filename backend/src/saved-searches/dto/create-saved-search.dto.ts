import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateSavedSearchDto {
  @ApiProperty({
    example: 'Appartement 3 pièces Antananarivo',
    description: 'Nom personnalisé donné à la recherche sauvegardée',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la recherche est obligatoire' })
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: TransactionType, example: 'SALE' })
  @IsOptional()
  @IsEnum(TransactionType, { message: 'Type de transaction invalide (SALE ou RENT)' })
  transactionType?: TransactionType;

  @ApiPropertyOptional({ example: 'Antananarivo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 100000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxArea?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minRooms?: number;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsString()
  propertyTypeId?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Activer les alertes de nouveaux biens' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
