import { Module } from '@nestjs/common';
import { EUDRDocumentsService } from './eudr-documents.service';
import { EUDRDocumentsController } from './eudr-documents.controller';

@Module({
  controllers: [EUDRDocumentsController],
  providers: [EUDRDocumentsService],
  exports: [EUDRDocumentsService],
})
export class EUDRDocumentsModule {}
