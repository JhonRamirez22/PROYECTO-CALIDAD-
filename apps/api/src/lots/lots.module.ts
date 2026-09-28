import { Module } from "@nestjs/common";
import { LotsService } from "./lots.service";
import { LotsController } from "./lots.controller";
import { FarmCertificatesModule } from "../farm-certificates/farm-certificates.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [FarmCertificatesModule, PrismaModule],
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService],
})
export class LotsModule {}
