import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, OrderFilterDto, UpdateOrderLotDto, UpdateOrderPackingDto, UpdateOrderStatusDto } from "./dto/order.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("orders")
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(dto, req.user?.sub);
  }

  @Get()
  findAll(@Query() filters: OrderFilterDto) {
    return this.ordersService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(":id/submit")
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  submitForApproval(@Param("id") id: string) {
    return this.ordersService.submitForApproval(id);
  }

  @Put(":id/items/:itemId/lot")
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  updateItemLot(@Param("id") id: string, @Param("itemId") itemId: string, @Body() dto: UpdateOrderLotDto, @Request() req: any) {
    return this.ordersService.updateItemLot(id, itemId, dto.lotId, req.user?.sub);
  }

  @Put(":id/items/:itemId/packing")
  @Roles("ADMIN", "OPERADOR", "VENDEDOR")
  updatePackingDetails(@Param("id") id: string, @Param("itemId") itemId: string, @Body() dto: UpdateOrderPackingDto) {
    return this.ordersService.updatePackingDetails(id, itemId, dto);
  }

  @Put(":id/approve")
  @Roles("ADMIN", "GERENTE")
  approve(@Param("id") id: string, @Request() req: any) {
    return this.ordersService.approve(id, req.user?.sub);
  }

  @Put(":id/reject")
  @Roles("ADMIN", "GERENTE")
  reject(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @Request() req: any
  ) {
    return this.ordersService.reject(id, req.user?.sub, reason);
  }

  @Put(":id/cancel")
  @Roles("ADMIN", "VENDEDOR")
  cancel(@Param("id") id: string) {
    return this.ordersService.cancel(id);
  }

  @Put(":id/ship")
  @Roles("ADMIN", "LOGISTICA")
  markShipped(@Param("id") id: string) {
    return this.ordersService.markShipped(id);
  }

  @Put(":id/deliver")
  @Roles("ADMIN", "LOGISTICA")
  markDelivered(@Param("id") id: string) {
    return this.ordersService.markDelivered(id);
  }

  @Put(":id/status")
  @Roles("ADMIN", "LOGISTICA")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateStatus(id, dto.status, dto.reason);
  }
}
