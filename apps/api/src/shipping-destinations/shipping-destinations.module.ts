import { Module } from '@nestjs/common';
import { ShippingDestinationsService } from './shipping-destinations.service';
import { ShippingDestinationsController } from './shipping-destinations.controller';

@Module({
  controllers: [ShippingDestinationsController],
  providers: [ShippingDestinationsService],
  exports: [ShippingDestinationsService],
})
export class ShippingDestinationsModule {}
