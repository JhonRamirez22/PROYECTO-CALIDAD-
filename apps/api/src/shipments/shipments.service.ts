import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto, UpdateShipmentDto } from './dto/shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateShipmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.shipment.count();
    return `SHP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateShipmentDto) {
    const shipmentNumber = await this.generateShipmentNumber();

    // Validate orders exist and are CONFIRMADO
    const orders = await this.prisma.order.findMany({
      where: { id: { in: dto.orderIds } },
    });
    if (orders.length !== dto.orderIds.length) {
      throw new BadRequestException('Uno o más pedidos no existen');
    }
    const invalid = orders.filter(o => o.status !== 'CONFIRMADO' && o.status !== 'BORRADOR');
    if (invalid.length > 0) {
      throw new BadRequestException(`Pedidos en estado inválido: ${invalid.map(o => o.orderNumber).join(', ')}`);
    }

    return this.prisma.shipment.create({
      data: {
        shipmentNumber,
        destinationId: dto.destinationId,
        providerId: dto.providerId,
        containerType: dto.containerType as any,
        containerNumber: dto.containerNumber,
        mode: dto.mode as any,
        needsTempControl: dto.needsTempControl ?? false,
        tempMinC: dto.tempMinC,
        tempMaxC: dto.tempMaxC,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : null,
        arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : null,
        estimatedArrival: dto.estimatedArrival ? new Date(dto.estimatedArrival) : null,
        insurancePolicy: dto.insurancePolicy,
        notes: dto.notes,
        orders: {
          create: dto.orderIds.map(orderId => ({ orderId })),
        },
      },
      include: {
        orders: { include: { order: true } },
        destination: true,
        provider: true,
      },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.shipment.findMany({
      where,
      include: {
        orders: { include: { order: true } },
        destination: true,
        provider: true,
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        orders: { include: { order: { include: { client: true, items: { include: { product: true } } } } } },
        destination: true,
        provider: true,
        booking: true,
        customsDocs: true,
        eudrDocs: true,
      },
    });
    if (!shipment) throw new NotFoundException('Embarque no encontrado');
    return shipment;
  }

  async update(id: string, dto: UpdateShipmentDto) {
    await this.findOne(id);

    // If orderIds provided, replace junction records
    if (dto.orderIds) {
      await this.prisma.shipmentOrder.deleteMany({ where: { shipmentId: id } });
      await this.prisma.shipmentOrder.createMany({
        data: dto.orderIds.map(orderId => ({ shipmentId: id, orderId })),
      });
    }

    const { orderIds, ...data } = dto;
    return this.prisma.shipment.update({
      where: { id },
      data: {
        ...data,
        containerType: data.containerType as any,
        mode: data.mode as any,
        departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
        arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : undefined,
        estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : undefined,
      },
      include: {
        orders: { include: { order: true } },
        destination: true,
        provider: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.shipment.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.shipmentOrder.deleteMany({ where: { shipmentId: id } });
    return this.prisma.shipment.delete({ where: { id } });
  }

  // Pooling: consolidate multiple orders into one shipment
  async consolidate(shipmentId: string, additionalOrderIds: string[]) {
    const shipment = await this.findOne(shipmentId);
    if (shipment.status !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden agregar pedidos a embarques en borrador');
    }

    const existingOrderIds = shipment.orders.map((o: any) => o.orderId);
    const newOrderIds = additionalOrderIds.filter(id => !existingOrderIds.includes(id));

    if (newOrderIds.length === 0) {
      throw new BadRequestException('Todos los pedidos ya están en este embarque');
    }

    await this.prisma.shipmentOrder.createMany({
      data: newOrderIds.map(orderId => ({ shipmentId, orderId })),
    });

    return this.findOne(shipmentId);
  }

  // Split: divide a shipment into two
  async split(shipmentId: string, orderIdsToSplit: string[], newDestinationId?: string) {
    const shipment = await this.findOne(shipmentId);
    if (shipment.status !== 'BORRADOR') {
      throw new BadRequestException('Solo se pueden dividir embarques en borrador');
    }

    // Create new shipment with the split orders
    const newShipmentNumber = await this.generateShipmentNumber();
    const newShipment = await this.prisma.shipment.create({
      data: {
        shipmentNumber: newShipmentNumber,
        destinationId: newDestinationId || shipment.destinationId,
        providerId: shipment.providerId,
        containerType: shipment.containerType,
        mode: shipment.mode,
        needsTempControl: shipment.needsTempControl,
        tempMinC: shipment.tempMinC,
        tempMaxC: shipment.tempMaxC,
        insurancePolicy: shipment.insurancePolicy,
        orders: {
          create: orderIdsToSplit.map(orderId => ({ orderId })),
        },
      },
      include: { orders: { include: { order: true } }, destination: true },
    });

    // Remove split orders from original shipment
    await this.prisma.shipmentOrder.deleteMany({
      where: { shipmentId, orderId: { in: orderIdsToSplit } },
    });

    return { original: await this.findOne(shipmentId), split: newShipment };
  }
}
