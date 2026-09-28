import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    // Verify shipment exists
    const shipment = await this.prisma.shipment.findUnique({ where: { id: dto.shipmentId } });
    if (!shipment) throw new NotFoundException('Embarque no encontrado');

    // Check if booking already exists
    const existing = await this.prisma.bookingConfirmation.findUnique({ where: { shipmentId: dto.shipmentId } });
    if (existing) throw new BadRequestException('Ya existe una confirmación de booking para este embarque');

    return this.prisma.bookingConfirmation.create({
      data: {
        shipmentId: dto.shipmentId,
        destinationId: dto.destinationId,
        bookingNumber: dto.bookingNumber,
        providerId: dto.providerId,
        containerNumber: dto.containerNumber,
        eta: dto.eta ? new Date(dto.eta) : null,
        trackingUrl: dto.trackingUrl,
        emotionalNote: dto.emotionalNote,
        photoUrl: dto.photoUrl,
      },
      include: {
        shipment: true,
        destination: true,
        provider: true,
      },
    });
  }

  async findAll(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.bookingConfirmation.findMany({
      where,
      include: {
        shipment: true,
        destination: true,
        provider: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.bookingConfirmation.findUnique({
      where: { id },
      include: {
        shipment: { include: { orders: { include: { order: true } } } },
        destination: true,
        provider: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking no encontrado');
    return booking;
  }

  async findByShipment(shipmentId: string) {
    const booking = await this.prisma.bookingConfirmation.findUnique({
      where: { shipmentId },
      include: { destination: true, provider: true },
    });
    if (!booking) throw new NotFoundException('Booking no encontrado para este embarque');
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto) {
    await this.findOne(id);
    return this.prisma.bookingConfirmation.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as any,
        eta: dto.eta ? new Date(dto.eta) : undefined,
      },
      include: {
        shipment: true,
        destination: true,
        provider: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bookingConfirmation.delete({ where: { id } });
  }
}
