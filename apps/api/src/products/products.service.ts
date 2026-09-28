import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from "./dto/product.dto";
import { NARINO_PRODUCT_ORIGIN, requireNarinoOrigin } from "./origin-policy";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const variety = dto.variety.trim();
    requireNarinoOrigin(dto.origin);
    const origin = NARINO_PRODUCT_ORIGIN;
    const exists = await this.prisma.product.findFirst({
      where: {
        variety: { equals: variety, mode: "insensitive" },
        origin: { equals: origin, mode: "insensitive" },
      },
    });
    if (exists) {
      throw new ConflictException(
        "Ya existe un producto con esta variedad y origen"
      );
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        type: dto.type as any,
        variety,
        origin,
        altitude: dto.altitude,
        process: dto.process,
        description: dto.description,
      },
      include: { lots: true, certificates: true },
    });
  }

  async findAll(filters?: ProductFilterDto) {
    const where: any = {
      AND: [
        {
          OR: [
            { origin: { contains: "Nariño", mode: "insensitive" } },
            { origin: { contains: "Narino", mode: "insensitive" } },
          ],
        },
      ],
    };
    if (filters?.type) where.type = filters.type;
    if (filters?.variety) where.variety = { contains: filters.variety, mode: "insensitive" };
    if (filters?.active !== undefined) where.active = filters.active;
    if (filters?.search) {
      where.AND.push({
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { variety: { contains: filters.search, mode: "insensitive" } },
          { origin: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }

    return this.prisma.product.findMany({
      where,
      include: {
        lots: { where: { status: "DISPONIBLE" } },
        _count: { select: { lots: true, orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        lots: { orderBy: { createdAt: "desc" } },
        certificates: { orderBy: { issuedAt: "desc" } },
        _count: { select: { orderItems: true } },
      },
    });
    if (!product) throw new NotFoundException("Producto no encontrado");
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    const newVariety = dto.variety?.trim() ?? product.variety;
    const newOrigin = dto.origin?.trim() ?? product.origin;
    if (dto.origin !== undefined) {
      requireNarinoOrigin(dto.origin);
    } else if (dto.active !== false) {
      requireNarinoOrigin(newOrigin);
    }
    const duplicate = await this.prisma.product.findFirst({
      where: {
        id: { not: id },
        variety: { equals: newVariety, mode: "insensitive" },
        origin: { equals: newOrigin, mode: "insensitive" },
      },
    });
    if (duplicate) {
      throw new ConflictException("Ya existe un producto con esta variedad y origen");
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        variety: newVariety,
        origin: dto.origin !== undefined ? NARINO_PRODUCT_ORIGIN : newOrigin,
        type: dto.type ? (dto.type as any) : undefined,
      },
      include: { lots: true, certificates: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }
}
