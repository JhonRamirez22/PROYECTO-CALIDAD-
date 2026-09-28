import { Module } from "@nestjs/common";
import { QualitySampleController } from "./quality-sample.controller";
import { QualitySampleService } from "./quality-sample.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [QualitySampleController],
  providers: [QualitySampleService],
  exports: [QualitySampleService],
})
export class QualitySampleModule {}
