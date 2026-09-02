import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class BoundingBoxSearchDto {
  @ApiProperty({
    description: 'Latitude minimale de la boîte englobante (coin sud-ouest)',
    example: 48.815,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  minLat!: number;

  @ApiProperty({
    description: 'Latitude maximale de la boîte englobante (coin nord-est)',
    example: 48.902,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  maxLat!: number;

  @ApiProperty({
    description: 'Longitude minimale de la boîte englobante (coin sud-ouest)',
    example: 2.224,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  minLng!: number;

  @ApiProperty({
    description: 'Longitude maximale de la boîte englobante (coin nord-est)',
    example: 2.469,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  maxLng!: number;
}
