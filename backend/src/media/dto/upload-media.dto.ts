import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadMediaDto {
  @ApiProperty({
    description: 'Type de média',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  type!: MediaType;

  @ApiPropertyOptional({
    description: 'Titre descriptif du média',
    example: 'Salon lumineux',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Description détaillée du média',
    example: 'Vue depuis la fenêtre principale vers le jardin',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Ordre d'affichage (0 = premier)",
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}

export class ReorderMediaDto {
  @ApiProperty({
    description:
      "Tableau ordonné des identifiants des médias dans le nouvel ordre d'affichage",
    example: ['media-uuid-1', 'media-uuid-3', 'media-uuid-2'],
    type: [String],
  })
  @IsString({ each: true })
  orderedIds!: string[];
}
