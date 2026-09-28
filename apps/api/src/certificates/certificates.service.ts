import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCertificateDto,
  UpdateCertificateDto,
  CertificateFilterDto,
} from "./dto/certificate.dto";

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCertificateDto) {
    if (!dto.productId && !dto.lotId && !dto.shipmentId) {
      throw new BadRequestException(
        "El certificado debe estar asociado a un producto, lote o envío"
      );
    }
    let shipment: { id: string; destination: { country: string; certificateFormats: string[] } } | null = null;
    if (dto.shipmentId) {
      shipment = await this.prisma.shipment.findUnique({
        where: { id: dto.shipmentId },
        include: { destination: { select: { country: true, certificateFormats: true } } },
      });
      if (!shipment) throw new NotFoundException("Envío no encontrado");
    }
    if (dto.type === "FITOSANITARIO" && (!dto.shipmentId || !dto.lotId)) {
      throw new BadRequestException("El certificado fitosanitario requiere envío y lote");
    }
    if (dto.type === "ORIGEN") {
      if (!shipment || (!dto.productId && !dto.lotId) || !dto.countryOfOrigin) {
        throw new BadRequestException("El certificado de origen requiere envío, producto o lote y país de origen");
      }
      if (!dto.documentFormat || !shipment.destination.certificateFormats.includes(dto.documentFormat)) {
        throw new BadRequestException(`Formato no configurado para el destino ${shipment.destination.country}`);
      }
    }
    return this.prisma.certificate.create({
      data: {
        productId: dto.productId || null,
        lotId: dto.lotId || null,
        shipmentId: dto.shipmentId || null,
        type: dto.type,
        number: dto.number,
        issuer: dto.issuer,
        documentFormat: dto.documentFormat,
        countryOfOrigin: dto.countryOfOrigin,
        issuedAt: new Date(dto.issuedAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
      },
      include: { product: true, lot: true },
    });
  }

  async findAll(filters?: CertificateFilterDto) {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.lotId) where.lotId = filters.lotId;
    if (filters?.shipmentId) where.shipmentId = filters.shipmentId;
    if (filters?.type) where.type = filters.type;
    if (filters?.issuedFrom || filters?.issuedTo) {
      where.issuedAt = {
        ...(filters.issuedFrom ? { gte: new Date(filters.issuedFrom) } : {}),
        ...(filters.issuedTo ? { lte: new Date(filters.issuedTo) } : {}),
      };
    }

    // Alerta de vencimiento: certificados que vencen dentro de N días
    if (filters?.expiringInDays !== undefined) {
      const now = new Date();
      const limit = new Date();
      limit.setDate(limit.getDate() + filters.expiringInDays);
      where.expiresAt = { gte: now, lte: limit };
    }
    if (filters?.status) {
      const now = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);
      if (filters.status === "VENCIDO") where.expiresAt = { lt: now };
      if (filters.status === "POR_VENCER") where.expiresAt = { gte: now, lte: soon };
      if (filters.status === "VIGENTE") {
        where.OR = [{ expiresAt: null }, { expiresAt: { gt: soon } }];
      }
    }

    return this.prisma.certificate.findMany({
      where,
      include: { product: true, lot: true, shipment: true },
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async findOne(id: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: { product: true, lot: true, shipment: true },
    });
    if (!cert) throw new NotFoundException("Certificado no encontrado");
    return cert;
  }

  async update(id: string, dto: UpdateCertificateDto) {
    await this.findOne(id);
    return this.prisma.certificate.update({
      where: { id },
      data: {
        ...dto,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        expiresAt:
          dto.expiresAt === undefined
            ? undefined
            : dto.expiresAt
              ? new Date(dto.expiresAt)
              : null,
      },
      include: { product: true, lot: true, shipment: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.certificate.delete({ where: { id } });
  }

  async attachFile(id: string, storedName: string) {
    await this.findOne(id);
    return this.prisma.certificate.update({
      where: { id },
      data: { fileUrl: storedName },
      include: { product: true, lot: true, shipment: true },
    });
  }

  async getFileRecord(id: string) {
    const certificate = await this.findOne(id);
    if (!certificate.fileUrl) {
      throw new NotFoundException("Este certificado no tiene un archivo adjunto");
    }
    return certificate;
  }
}
