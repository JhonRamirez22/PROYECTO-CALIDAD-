import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SellerProfilesService } from "../seller-profiles/seller-profiles.service";

@Injectable()
export class CommissionsService {
  constructor(
    private prisma: PrismaService,
    private sellerProfiles: SellerProfilesService,
  ) {}

  async create(data: { orderId: string; sellerId: string; amount: number; percentage: number }) {
    return this.prisma.commission.create({
      data: {
        orderId: data.orderId,
        sellerId: data.sellerId,
        amount: data.amount,
        percentage: data.percentage,
      },
      include: {
        order: { select: { id: true, totalAmount: true } },
        seller: { select: { id: true, email: true } },
      },
    });
  }

  async createFromOrder(orderId: string, sellerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { totalAmount: true },
    });
    if (!order?.totalAmount) throw new Error('Order total amount not found');

    const commissionAmount = await this.sellerProfiles.calculateCommission(
      Number(order.totalAmount),
      sellerId,
    );
    const profile = await this.sellerProfiles.findByUser(sellerId);
    const percentage = profile?.commissionRate ? Number(profile.commissionRate) * 100 : 1;

    return this.create({
      orderId,
      sellerId,
      amount: commissionAmount,
      percentage,
    });
  }

  async findAll() {
    return this.prisma.commission.findMany({
      include: {
        order: { select: { id: true, totalAmount: true, currency: true } },
        seller: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.commission.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, totalAmount: true, currency: true } },
        seller: { select: { id: true, email: true } },
      },
    });
  }

  async findBySeller(sellerId: string) {
    return this.prisma.commission.findMany({
      where: { sellerId },
      include: {
        order: { select: { id: true, totalAmount: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: { status?: string; paidAt?: Date }) {
    return this.prisma.commission.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status as any }),
        ...(data.paidAt && { paidAt: data.paidAt }),
      },
      include: {
        order: { select: { id: true, totalAmount: true } },
        seller: { select: { id: true, email: true } },
      },
    });
  }
}
