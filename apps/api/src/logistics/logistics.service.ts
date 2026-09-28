import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLogisticsEntryDto, UpdateLogisticsEntryDto } from "./dto/logistics.dto";

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLogisticsEntryDto) {
    return this.prisma.logisticsEntry.create({
      data: {
        orderId: dto.orderId,
        status: (dto.status as any) || "REGISTRADO",
        transporter: dto.transporter,
        trackingNumber: dto.trackingNumber,
        originPort: dto.originPort,
        destPort: dto.destPort,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : null,
        arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : null,
        notes: dto.notes,
      },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            currency: true,
            client: { select: { id: true, company: true, email: true } },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.logisticsEntry.findMany({
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            currency: true,
            status: true,
            client: { select: { id: true, company: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.logisticsEntry.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            currency: true,
            status: true,
            client: { select: { id: true, company: true, email: true } },
          },
        },
      },
    });
  }

  async findByOrder(orderId: string) {
    return this.prisma.logisticsEntry.findMany({
      where: { orderId },
      include: { order: { select: { id: true, totalAmount: true, currency: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, dto: UpdateLogisticsEntryDto) {
    return this.prisma.logisticsEntry.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as any }),
        ...(dto.transporter && { transporter: dto.transporter }),
        ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber }),
        ...(dto.originPort && { originPort: dto.originPort }),
        ...(dto.destPort && { destPort: dto.destPort }),
        ...(dto.departureDate !== undefined && {
          departureDate: dto.departureDate ? new Date(dto.departureDate) : null,
        }),
        ...(dto.arrivalDate !== undefined && {
          arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            currency: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.logisticsEntry.delete({ where: { id } });
  }
}
