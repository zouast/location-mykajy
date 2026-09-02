import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class RadiusSearchDto {
  @ApiProperty({
    description: 'Latitude du point central de la recherche (degrés décimaux)',
    example: 48.8566,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({
    description: 'Longitude du point central de la recherche (degrés décimaux)',
    example: 2.3522,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiPropertyOptional({
    description: 'Rayon de recherche en kilomètres (défaut : 10 km)',
    example: 5,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(500)
  radiusKm?: number = 10;
}
