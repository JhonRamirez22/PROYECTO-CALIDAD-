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
import { LogisticsService } from "./logistics.service";
import { CreateLogisticsEntryDto, UpdateLogisticsEntryDto } from "./dto/logistics.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("logistics")
@UseGuards(AuthGuard, RolesGuard)
export class LogisticsController {
  constructor(private logisticsService: LogisticsService) {}

  @Post()
  @Roles("ADMIN", "LOGISTICA")
  create(@Body() dto: CreateLogisticsEntryDto) {
    return this.logisticsService.create(dto);
  }

  @Get()
  @Roles("ADMIN", "LOGISTICA")
  findAll() {
    return this.logisticsService.findAll();
  }

  @Get("order/:orderId")
  @Roles("ADMIN", "LOGISTICA", "COMPRADOR")
  findByOrder(@Param("orderId") orderId: string) {
    return this.logisticsService.findByOrder(orderId);
  }

  @Get(":id")
  @Roles("ADMIN", "LOGISTICA", "COMPRADOR")
  findOne(@Param("id") id: string) {
    return this.logisticsService.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "LOGISTICA")
  update(@Param("id") id: string, @Body() dto: UpdateLogisticsEntryDto) {
    return this.logisticsService.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.logisticsService.remove(id);
  }
}
