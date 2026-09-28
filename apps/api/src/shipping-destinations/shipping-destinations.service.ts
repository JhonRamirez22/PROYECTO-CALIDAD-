import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShippingDestinationDto, UpdateShippingDestinationDto } from './dto/shipping-destination.dto';

@Injectable()
export class ShippingDestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShippingDestinationDto) {
    return this.prisma.shippingDestination.create({ data: dto });
  }

  async findAll() {
    return this.prisma.shippingDestination.findMany({ orderBy: { country: 'asc' } });
  }

  async findOne(id: string) {
    const dest = await this.prisma.shippingDestination.findUnique({
      where: { id },
      include: { shipments: true },
    });
    if (!dest) throw new NotFoundException('Destino no encontrado');
    return dest;
  }

  async update(id: string, dto: UpdateShippingDestinationDto) {
    await this.findOne(id);
    return this.prisma.shippingDestination.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.shippingDestination.delete({ where: { id } });
  }
}
