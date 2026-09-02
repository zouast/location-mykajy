import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class LocationSearchDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Recherche libre (ville, quartier, code postal, adresse)',
    example: 'Montmartre',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par pays',
    example: 'France',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par région / état',
    example: 'Île-de-France',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ville',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par commune',
    example: 'Paris 18e',
  })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par quartier',
    example: 'Montmartre',
  })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Code postal',
    example: '75018',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;
}
