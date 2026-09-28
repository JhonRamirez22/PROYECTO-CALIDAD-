import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto, CreateContactDto, ClientFilterDto, UpdateContactDto, CreateClientContractDto } from "./dto/client.dto";
import { normalizeAndValidateVatId } from "./vat-validation";

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const vatId = normalizeAndValidateVatId(dto.country, dto.vatId);
    const exists = await this.prisma.client.findUnique({
      where: { vatId },
    });
    if (exists) {
      throw new ConflictException("Ya existe un cliente con este VAT ID");
    }

    return this.prisma.client.create({
      data: { ...dto, vatId },
      include: { contacts: true },
    });
  }

  async findAll(filters?: ClientFilterDto) {
    const where: any = {};
    if (filters?.country) where.country = filters.country;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { company: { contains: filters.search, mode: "insensitive" } },
        { vatId: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      include: {
        contacts: true,
        contracts: { orderBy: { startDate: "desc" } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { isPrimary: "desc" } },
        contracts: { orderBy: { startDate: "desc" } },
        orders: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!client) throw new NotFoundException("Cliente no encontrado");
    return client;
  }

  async addContact(clientId: string, dto: CreateContactDto) {
    await this.findOne(clientId);
    return this.prisma.clientContact.create({
      data: { ...dto, clientId },
    });
  }

  async removeContact(contactId: string) {
    const contact = await this.prisma.clientContact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException("Contacto no encontrado");
    return this.prisma.clientContact.delete({ where: { id: contactId } });
  }

  async updateContact(contactId: string, dto: UpdateContactDto) {
    const contact = await this.prisma.clientContact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException("Contacto no encontrado");
    return this.prisma.clientContact.update({ where: { id: contactId }, data: dto });
  }

  async createContract(clientId: string, dto: CreateClientContractDto) {
    await this.findOne(clientId);
    const existing = await this.prisma.clientContract.findUnique({ where: { contractNumber: dto.contractNumber } });
    if (existing) throw new ConflictException("Ya existe un contrato con ese número");
    return this.prisma.clientContract.create({
      data: {
        clientId,
        contractNumber: dto.contractNumber.trim(),
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: (dto.status as any) ?? "ACTIVO",
      },
    });
  }

  async getPurchaseHistory(clientId: string) {
    await this.findOne(clientId);

    const orders = await this.prisma.order.findMany({
      where: { clientId },
      include: {
        items: { include: { product: true, lot: true } },
        commission: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const averageOrder = totalOrders > 0 ? totalAmount / totalOrders : 0;

    return {
      clientId,
      summary: { totalOrders, totalAmount, averageOrder },
      orders,
    };
  }
}
