import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { QualitySampleService } from "./quality-sample.service";
import { CreateQualitySampleVerificationDto, UpdateQualitySampleVerificationDto } from "./dto/quality-sample.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("quality-sample")
@UseGuards(AuthGuard, RolesGuard)
export class QualitySampleController {
  constructor(private qualitySampleService: QualitySampleService) {}

  @Post()
  @Roles("ADMIN", "PROPIETARIO", "LOGISTICA")
  create(@Body() dto: CreateQualitySampleVerificationDto) {
    return this.qualitySampleService.create(dto);
  }

  @Get()
  @Roles("ADMIN", "PROPIETARIO", "LOGISTICA")
  findAll() {
    return this.qualitySampleService.findAll();
  }

  @Get("lot/:lotId")
  findByLot(@Param("lotId") lotId: string) {
    return this.qualitySampleService.findByLot(lotId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.qualitySampleService.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "LOGISTICA")
  update(@Param("id") id: string, @Body() dto: UpdateQualitySampleVerificationDto) {
    return this.qualitySampleService.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.qualitySampleService.remove(id);
  }
}
