import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomsDocumentDto, UpdateCustomsDocumentDto } from './dto/customs-document.dto';

@Injectable()
export class CustomsDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateDocumentNumber(type: string): Promise<string> {
    const prefix = type === 'DUA' ? 'DUA' : 'SAD';
    const year = new Date().getFullYear();
    const count = await this.prisma.customsDocument.count({ where: { type: type as any } });
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateCustomsDocumentDto) {
    const documentNumber = dto.documentNumber || await this.generateDocumentNumber(dto.type);

    return this.prisma.customsDocument.create({
      data: {
        shipmentId: dto.shipmentId,
        type: dto.type as any,
        documentNumber,
        exporterInfo: dto.exporterInfo,
        importerInfo: dto.importerInfo,
        goodsInfo: dto.goodsInfo,
        notes: dto.notes,
      },
      include: { shipment: true },
    });
  }

  async findAll(type?: string, status?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    return this.prisma.customsDocument.findMany({
      where,
      include: { shipment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.customsDocument.findUnique({
      where: { id },
      include: { shipment: { include: { orders: { include: { order: true } } } } },
    });
    if (!doc) throw new NotFoundException('Documento aduanero no encontrado');
    return doc;
  }

  async update(id: string, dto: UpdateCustomsDocumentDto) {
    await this.findOne(id);
    return this.prisma.customsDocument.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as any,
      },
      include: { shipment: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customsDocument.delete({ where: { id } });
  }
}
