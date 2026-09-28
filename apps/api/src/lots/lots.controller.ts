import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { LotsService } from "./lots.service";
import { CreateLotDto, UpdateLotDto, LotFilterDto } from "./dto/lot.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("lots")
@UseGuards(AuthGuard, RolesGuard)
export class LotsController {
  constructor(private lotsService: LotsService) {}

  @Post()
  @Roles("ADMIN", "OPERADOR", "PROPIETARIO", "VENDEDOR")
  create(@Body() dto: CreateLotDto) {
    return this.lotsService.create(dto);
  }

  @Get("inventory")
  @Roles("ADMIN", "GERENTE", "OPERADOR", "PROPIETARIO", "VENDEDOR", "LOGISTICA")
  getInventory() {
    return this.lotsService.getInventory();
  }

  @Get()
  findAll(@Query() filters: LotFilterDto) {
    return this.lotsService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.lotsService.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "GERENTE", "OPERADOR", "PROPIETARIO")
  update(@Param("id") id: string, @Body() dto: UpdateLotDto) {
    return this.lotsService.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.lotsService.remove(id);
  }
}
