import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { QualityService } from "./quality.service";
import {
  CreateQualityAnalysisDto,
  QualityAnalysisFilterDto,
} from "./dto/quality-analysis.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("quality")
@UseGuards(AuthGuard, RolesGuard)
export class QualityController {
  constructor(private qualityService: QualityService) {}

  @Post()
  @Roles("ADMIN", "PROPIETARIO")
  create(@Body() dto: CreateQualityAnalysisDto) {
    return this.qualityService.create(dto);
  }

  @Get()
  findAll(@Query() filters: QualityAnalysisFilterDto) {
    return this.qualityService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.qualityService.findOne(id);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.qualityService.remove(id);
  }
}
