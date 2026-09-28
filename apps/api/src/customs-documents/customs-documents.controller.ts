import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CustomsDocumentsService } from './customs-documents.service';
import { CreateCustomsDocumentDto, UpdateCustomsDocumentDto } from './dto/customs-document.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('customs-documents')
export class CustomsDocumentsController {
  constructor(private readonly service: CustomsDocumentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  create(@Body() dto: CreateCustomsDocumentDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  findAll(@Query('type') type?: string, @Query('status') status?: string) {
    return this.service.findAll(type, status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA, UserRole.PROPIETARIO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGISTICA)
  update(@Param('id') id: string, @Body() dto: UpdateCustomsDocumentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
