import { Module } from '@nestjs/common';
import { PropertyTypesService } from './property-types.service';
import { PropertyTypesController } from './property-types.controller';

@Module({
  providers: [PropertyTypesService],
  controllers: [PropertyTypesController],
})
export class PropertyTypesModule {}
