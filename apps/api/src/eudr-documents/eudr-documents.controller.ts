import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EUDRDocumentsService } from './eudr-documents.service';
import { CreateEUDRDocumentDto, UpdateEUDRDocumentDto } from './dto/eudr-document.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('eudr-documents')
export class EUDRDocumentsController {
  constructor(private readonly service: EUDRDocumentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  create(@Body() dto: CreateEUDRDocumentDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  update(@Param('id') id: string, @Body() dto: UpdateEUDRDocumentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
