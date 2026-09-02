import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingSearchResultDto } from '../../listings/dto/listing-search-response.dto';

export class FavoriteResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  listingId!: string;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ type: () => ListingSearchResultDto })
  listing?: ListingSearchResultDto;
}

export class FavoriteIdsResponseDto {
  @ApiProperty({ example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'] })
  listingIds!: string[];
}
