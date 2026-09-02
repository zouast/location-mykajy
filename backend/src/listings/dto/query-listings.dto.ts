import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto, SortOrder } from '../../common/dto/pagination.dto';

export class QueryListingsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrer par type de transaction',
    enum: TransactionType,
    example: TransactionType.RENT,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    description: "Filtrer par statut d'annonce",
    enum: ListingStatus,
    example: ListingStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ description: 'Filtrer par ville', example: 'Paris' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par quartier',
    example: 'Montmartre',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Prix minimum', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Prix maximum', example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Annonces mises en avant uniquement',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: "Identifiant de l'agence (filtre admin/agence)",
    example: 'agency-uuid-123',
  })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    enum: ['publishedAt', 'price', 'createdAt', 'viewsCount'],
    example: 'publishedAt',
  })
  @IsOptional()
  @IsString()
  sortBy: string = 'publishedAt';

  @ApiPropertyOptional({
    description: 'Direction du tri',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder: SortOrder = SortOrder.DESC;
}
