import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingSearchService } from './listing-search.service';
import { ListingsController } from './listings.controller';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, ListingSearchService],
  exports: [ListingsService, ListingSearchService],
})
export class ListingsModule {}
