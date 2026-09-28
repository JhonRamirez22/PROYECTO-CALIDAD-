import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { DocumentsService } from "./documents.service";
import { PackingListService } from "./packing-list.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto/document.dto";
import { CreateProformaDto } from "./dto/create-proforma.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("documents")
@UseGuards(AuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private documentsService: DocumentsService,
    private packingListService: PackingListService,
  ) {}

  @Post()
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO", "LOGISTICA")
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create({
      ...dto,
      issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Get()
  @Roles("ADMIN", "PROPIETARIO", "LOGISTICA", "COMPRADOR")
  findAll(@Query("type") type?: string) {
    if (type) return this.documentsService.findByType(type);
    return this.documentsService.findAll();
  }

  @Get("order/:orderId")
  @Roles("ADMIN", "PROPIETARIO", "LOGISTICA", "COMPRADOR")
  findByOrder(@Param("orderId") orderId: string) {
    return this.documentsService.findByOrder(orderId);
  }

  @Get(":id")
  @Roles("ADMIN", "PROPIETARIO", "LOGISTICA", "COMPRADOR")
  findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO", "LOGISTICA")
  update(@Param("id") id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, {
      ...dto,
      issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Get(":id/file")
  @Roles("ADMIN", "GERENTE", "OPERADOR", "CONTADOR", "PROPIETARIO", "LOGISTICA", "COMPRADOR")
  async downloadStoredFile(@Param("id") id: string, @Res() res: Response) {
    const { document, buffer } = await this.documentsService.readStoredFile(id);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${document.number.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`,
      "Cache-Control": "private, no-store",
    });
    res.send(buffer);
  }

  @Put(":id/generate-pdf")
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO", "LOGISTICA")
  generatePdf(@Param("id") id: string) {
    return this.documentsService.generatePdf(id);
  }

  @Get("packing-list/:orderId")
  @Roles("ADMIN", "GERENTE", "OPERADOR", "CONTADOR", "PROPIETARIO", "LOGISTICA")
  async getPackingList(
    @Param("orderId") orderId: string,
    @Res() res: Response
  ) {
    const pdf = await this.packingListService.generatePackingList(orderId);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=packing-list-${orderId}.pdf`,
    });
    res.send(pdf);
  }

  @Post("proforma/:orderId")
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO", "LOGISTICA")
  async generateProforma(
    @Param("orderId") orderId: string,
    @Body() dto: CreateProformaDto,
    @Res() res: Response,
  ) {
    const pdf = await this.documentsService.generateProformaPdf(orderId, dto.validUntil);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=proforma-${orderId}.pdf`,
      "Cache-Control": "private, no-store",
    });
    res.send(pdf);
  }

  @Post("proforma/:orderId/email")
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO", "LOGISTICA")
  emailProforma(@Param("orderId") orderId: string, @Body() dto: CreateProformaDto) {
    return this.documentsService.emailProforma(orderId, dto.validUntil);
  }
}
