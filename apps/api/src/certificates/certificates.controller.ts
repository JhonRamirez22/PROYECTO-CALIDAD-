import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import { CertificatesService } from "./certificates.service";
import {
  CreateCertificateDto,
  UpdateCertificateDto,
  CertificateFilterDto,
} from "./dto/certificate.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("certificates")
@UseGuards(AuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @Post()
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO", "VENDEDOR")
  create(@Body() dto: CreateCertificateDto) {
    return this.certificatesService.create(dto);
  }

  @Post(":id/file")
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO", "VENDEDOR")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(
    @Param("id") id: string,
    @UploadedFile() file: { originalname: string; mimetype: string; buffer: Buffer } | undefined,
  ) {
    if (!file) throw new BadRequestException("Seleccione un archivo PDF, JPG o PNG");
    const extensionByType: Record<string, string> = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg",
      "image/png": ".png",
    };
    const extension = extensionByType[file.mimetype];
    if (!extension) {
      throw new BadRequestException("Formato no permitido; use PDF, JPG o PNG");
    }

    const folder = process.env.RITECH_UPLOAD_DIR || join(process.cwd(), "storage", "certificates");
    await mkdir(folder, { recursive: true });
    const storedName = `${randomUUID()}${extension}`;
    const absolutePath = join(folder, storedName);
    await writeFile(absolutePath, file.buffer, { flag: "wx" });
    try {
      return await this.certificatesService.attachFile(id, `certificates/${storedName}`);
    } catch (error) {
      await unlink(absolutePath).catch(() => undefined);
      throw error;
    }
  }

  @Get(":id/file")
  @Roles("ADMIN", "GERENTE", "OPERADOR", "CONTADOR", "PROPIETARIO", "VENDEDOR", "COMPRADOR")
  async downloadFile(@Param("id") id: string, @Res() response: Response) {
    const certificate = await this.certificatesService.getFileRecord(id);
    const storedName = basename(certificate.fileUrl ?? "");
    const folder = process.env.RITECH_UPLOAD_DIR || join(process.cwd(), "storage", "certificates");
    const filePath = join(folder, storedName);
    const file = await readFile(filePath);
    const extension = extname(storedName).toLowerCase();
    const contentType = extension === ".pdf" ? "application/pdf" : extension === ".png" ? "image/png" : "image/jpeg";
    const safeNumber = certificate.number.replace(/[^A-Za-z0-9_-]/g, "_");
    response.setHeader("Content-Type", contentType);
    response.setHeader("Content-Disposition", `attachment; filename=certificado-${safeNumber}${extension}`);
    response.setHeader("Cache-Control", "private, no-store");
    response.send(file);
  }

  @Get()
  findAll(@Query() filters: CertificateFilterDto) {
    return this.certificatesService.findAll(filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.certificatesService.findOne(id);
  }

  @Put(":id")
  @Roles("ADMIN", "OPERADOR", "CONTADOR", "PROPIETARIO")
  update(@Param("id") id: string, @Body() dto: UpdateCertificateDto) {
    return this.certificatesService.update(id, dto);
  }

  @Delete(":id")
  @Roles("ADMIN")
  remove(@Param("id") id: string) {
    return this.certificatesService.remove(id);
  }
}
