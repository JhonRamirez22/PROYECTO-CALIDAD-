import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLotDto, UpdateLotDto, LotFilterDto } from "./dto/lot.dto";
import { LotStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<LotStatus, LotStatus[]> = {
  DISPONIBLE: ["DISPONIBLE", "RESERVADO", "CERTIFICADO"],
  RESERVADO: ["RESERVADO", "DISPONIBLE", "ENVIADO", "CERTIFICADO"],
  ENVIADO: ["ENVIADO", "CERTIFICADO"],
  CERTIFICADO: ["CERTIFICADO", "DISPONIBLE", "RESERVADO", "ENVIADO"],
};

@Injectable()
export class LotsService {
  constructor(private prisma: PrismaService) {}

  private async generateTraceCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.lot.count();
    return `LT-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  async create(dto: CreateLotDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException("Producto no encontrado");

    const code = dto.traceabilityCode || (await this.generateTraceCode());
    return this.prisma.lot.create({
      data: {
        traceabilityCode: code,
        productId: dto.productId,
        weight: dto.weight,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : null,
        processDate: dto.processDate ? new Date(dto.processDate) : null,
        originLocation: dto.originLocation,
        notes: dto.notes,
        ownedById: dto.ownerId || null,
      },
      include: { product: true, owner: { select: { id: true, email: true } } },
    });
  }

  async findAll(filters?: LotFilterDto) {
    const where: any = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.lot.findMany({
      where,
      include: {
        product: true,
        owner: { select: { id: true, email: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const [lot, history] = await Promise.all([
      this.prisma.lot.findUnique({
        where: { id },
        include: {
          product: true,
          owner: { select: { id: true, email: true } },
          orderItems: {
            include: {
              order: {
                include: {
                  client: true,
                  shipmentOrders: { include: { shipment: { include: { destination: true } } } },
                },
              },
            },
          },
          certificates: true,
          qualityAnalyses: true,
          sampleVerifications: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where: { module: "lots", entityId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    if (!lot) throw new NotFoundException("Lote no encontrado");
    const assignmentHistory = history.filter((entry) => {
      const event = (entry.newValues as Record<string, unknown> | null)?.event;
      return event === "ORDER_LOT_ASSIGNED" || event === "ORDER_LOT_RELEASED";
    });
    return { ...lot, history: assignmentHistory };
  }

  async update(id: string, dto: UpdateLotDto) {
    const lot = await this.findOne(id);

    if (
      dto.status &&
      dto.status !== lot.status &&
      !ALLOWED_TRANSITIONS[lot.status].includes(dto.status as LotStatus)
    ) {
      throw new BadRequestException(
        `Transición de estado inválida: ${lot.status} → ${dto.status}`
      );
    }

    return this.prisma.lot.update({
      where: { id },
      data: {
        weight: dto.weight,
        harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : undefined,
        processDate: dto.processDate ? new Date(dto.processDate) : undefined,
        originLocation: dto.originLocation,
        notes: dto.notes,
        status: dto.status as any,
      },
      include: { product: true, owner: { select: { id: true, email: true } } },
    });
  }

  async remove(id: string) {
    const lot = await this.findOne(id);
    if (lot.orderItems.length > 0) {
      throw new BadRequestException(
        "No se puede eliminar el lote: está asociado a pedidos de exportación"
      );
    }
    return this.prisma.lot.delete({ where: { id } });
  }

  async getInventory() {
    const lots = await this.prisma.lot.findMany({
      include: {
        product: true,
        certificates: { select: { id: true, type: true, expiresAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const byProduct = new Map<string, any>();
    for (const lot of lots) {
      if (!byProduct.has(lot.productId)) {
        byProduct.set(lot.productId, {
          productId: lot.productId,
          productName: lot.product.name,
          productType: lot.product.type,
          variety: lot.product.variety,
          origin: lot.product.origin,
          process: lot.product.process,
          totalWeight: 0,
          disponibleWeight: 0,
          reservadoWeight: 0,
          enviadoWeight: 0,
          certificadoWeight: 0,
          lotsCount: 0,
          certificatesCount: 0,
          lots: [],
        });
      }
      const entry = byProduct.get(lot.productId);
      const weight = Number(lot.weight);

      entry.totalWeight += weight;
      entry.lotsCount += 1;
      entry.certificatesCount += lot.certificates.length;

      switch (lot.status) {
        case "DISPONIBLE":
          entry.disponibleWeight += weight;
          break;
        case "RESERVADO":
          entry.reservadoWeight += weight;
          break;
        case "ENVIADO":
          entry.enviadoWeight += weight;
          break;
        case "CERTIFICADO":
          entry.certificadoWeight += weight;
          break;
      }

      entry.lots.push({
        id: lot.id,
        traceabilityCode: lot.traceabilityCode,
        status: lot.status,
        weight,
        harvestDate: lot.harvestDate,
        originLocation: lot.originLocation,
        certificatesCount: lot.certificates.length,
      });
    }

    return Array.from(byProduct.values());
  }
}
