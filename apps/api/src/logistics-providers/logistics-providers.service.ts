import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogisticsProviderDto, UpdateLogisticsProviderDto } from './dto/logistics-provider.dto';

@Injectable()
export class LogisticsProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLogisticsProviderDto) {
    return this.prisma.logisticsProvider.create({ data: dto });
  }

  async findAll(type?: string) {
    const where = type ? { type: type as any } : {};
    return this.prisma.logisticsProvider.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const provider = await this.prisma.logisticsProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Proveedor de logística no encontrado');
    return provider;
  }

  async update(id: string, dto: UpdateLogisticsProviderDto) {
    await this.findOne(id);
    return this.prisma.logisticsProvider.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.logisticsProvider.delete({ where: { id } });
  }
}
