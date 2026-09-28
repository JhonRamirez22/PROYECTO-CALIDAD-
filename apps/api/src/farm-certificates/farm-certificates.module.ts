import { Module } from "@nestjs/common";
import { FarmCertificatesController } from "./farm-certificates.controller";
import { FarmCertificatesService } from "./farm-certificates.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [FarmCertificatesController],
  providers: [FarmCertificatesService],
  exports: [FarmCertificatesService],
})
export class FarmCertificatesModule {}
