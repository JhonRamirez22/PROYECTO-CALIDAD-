import { Module } from '@nestjs/common';
import { LogisticsProvidersService } from './logistics-providers.service';
import { LogisticsProvidersController } from './logistics-providers.controller';

@Module({
  controllers: [LogisticsProvidersController],
  providers: [LogisticsProvidersService],
  exports: [LogisticsProvidersService],
})
export class LogisticsProvidersModule {}
