import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() dto: CreateBookingDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO, UserRole.COMPRADOR)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO, UserRole.COMPRADOR)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('shipment/:shipmentId')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO, UserRole.COMPRADOR)
  findByShipment(@Param('shipmentId') shipmentId: string) {
    return this.service.findByShipment(shipmentId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
