import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto, UpdateShipmentDto, UpdateShipmentStatusDto } from './dto/shipment.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly service: ShipmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() dto: CreateShipmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR, UserRole.CONTADOR, UserRole.LOGISTICA, UserRole.PROPIETARIO, UserRole.COMPRADOR)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.GERENTE, UserRole.OPERADOR, UserRole.CONTADOR, UserRole.LOGISTICA, UserRole.PROPIETARIO, UserRole.COMPRADOR)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @Post(':id/consolidate')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  consolidate(@Param('id') id: string, @Body('orderIds') orderIds: string[]) {
    return this.service.consolidate(id, orderIds);
  }

  @Post(':id/split')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  split(
    @Param('id') id: string,
    @Body('orderIdsToSplit') orderIdsToSplit: string[],
    @Body('newDestinationId') newDestinationId?: string,
  ) {
    return this.service.split(id, orderIdsToSplit, newDestinationId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
