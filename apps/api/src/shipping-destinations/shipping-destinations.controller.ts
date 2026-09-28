import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ShippingDestinationsService } from './shipping-destinations.service';
import { CreateShippingDestinationDto, UpdateShippingDestinationDto } from './dto/shipping-destination.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('shipping-destinations')
export class ShippingDestinationsController {
  constructor(private readonly service: ShippingDestinationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() dto: CreateShippingDestinationDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO, UserRole.COMPRADOR)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() dto: UpdateShippingDestinationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
