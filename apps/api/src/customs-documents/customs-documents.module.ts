import { Module } from '@nestjs/common';
import { CustomsDocumentsService } from './customs-documents.service';
import { CustomsDocumentsController } from './customs-documents.controller';

@Module({
  controllers: [CustomsDocumentsController],
  providers: [CustomsDocumentsService],
  exports: [CustomsDocumentsService],
})
export class CustomsDocumentsModule {}
