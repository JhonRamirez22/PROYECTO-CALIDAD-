import { Module } from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { PackingListService } from "./packing-list.service";
import { DocumentsController } from "./documents.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PackingListService],
  exports: [DocumentsService, PackingListService],
})
export class DocumentsModule {}
