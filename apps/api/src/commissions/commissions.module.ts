import { Module } from "@nestjs/common";
import { CommissionsController } from "./commissions.controller";
import { CommissionsService } from "./commissions.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SellerProfilesModule } from "../seller-profiles/seller-profiles.module";

@Module({
  imports: [PrismaModule, SellerProfilesModule],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
