import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { LogisticsProvidersService } from './logistics-providers.service';
import { CreateLogisticsProviderDto, UpdateLogisticsProviderDto } from './dto/logistics-provider.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('logistics-providers')
export class LogisticsProvidersController {
  constructor(private readonly service: LogisticsProvidersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() dto: CreateLogisticsProviderDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  findAll(@Query('type') type?: string) {
    return this.service.findAll(type);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() dto: UpdateLogisticsProviderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
