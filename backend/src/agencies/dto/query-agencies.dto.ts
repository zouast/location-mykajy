import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryAgenciesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrer par ville',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut vérifié',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par statut actif',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Recherche par nom, email, ville ou SIRET',
    example: 'prestige',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
