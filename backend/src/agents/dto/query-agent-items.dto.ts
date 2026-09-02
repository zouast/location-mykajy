import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, PropertyStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryAgentPropertiesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrer par statut de bien',
    enum: PropertyStatus,
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({
    description: 'Recherche par titre de bien ou ville',
    example: 'Appartement Paris',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryAgentListingsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Filtrer par statut d'annonce",
    enum: ListingStatus,
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({
    description: "Recherche par titre d'annonce",
    example: 'Duplex',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
