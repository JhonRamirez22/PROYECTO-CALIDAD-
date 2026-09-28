import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEUDRDocumentDto, UpdateEUDRDocumentDto } from './dto/eudr-document.dto';

@Injectable()
export class EUDRDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEUDRDocumentDto) {
    return this.prisma.eUDRDocument.create({
      data: {
        shipmentId: dto.shipmentId,
        lotId: dto.lotId,
        gpsLatitude: dto.gpsLatitude,
        gpsLongitude: dto.gpsLongitude,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null,
        deforestationEvidence: dto.deforestationEvidence,
        declarationText: dto.declarationText,
        notes: dto.notes,
      },
      include: { shipment: true, lot: true },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.eUDRDocument.findMany({
      where,
      include: { shipment: true, lot: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.eUDRDocument.findUnique({
      where: { id },
      include: {
        shipment: { include: { orders: { include: { order: true } } } },
        lot: { include: { product: true } },
      },
    });
    if (!doc) throw new NotFoundException('Documento EUDR no encontrado');
    return doc;
  }

  async update(id: string, dto: UpdateEUDRDocumentDto) {
    await this.findOne(id);
    return this.prisma.eUDRDocument.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as any,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
      },
      include: { shipment: true, lot: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.eUDRDocument.delete({ where: { id } });
  }
}
