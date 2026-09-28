import { Module } from "@nestjs/common";
import { SellerProfilesController } from "./seller-profiles.controller";
import { SellerProfilesService } from "./seller-profiles.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { FarmCertificatesModule } from "../farm-certificates/farm-certificates.module";

@Module({
  imports: [PrismaModule, ConfigModule, FarmCertificatesModule],
  controllers: [SellerProfilesController],
  providers: [SellerProfilesService],
  exports: [SellerProfilesService],
})
export class SellerProfilesModule {}
