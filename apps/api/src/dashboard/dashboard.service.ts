import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(filters?: { startDate?: string; endDate?: string }) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const dateFilter: any = {};
    if (filters?.startDate) dateFilter.gte = new Date(filters.startDate);
    if (filters?.endDate) dateFilter.lte = new Date(filters.endDate);

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalClients,
      totalProducts,
      totalLots,
      monthlyRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      this.prisma.order.count({
        where: filters?.startDate || filters?.endDate ? { createdAt: dateFilter } : {},
      }),
      this.prisma.order.count({
        where: {
          status: { in: ["BORRADOR", "PENDIENTE_APROBACION"] },
          ...(filters?.startDate || filters?.endDate ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.order.count({
        where: {
          status: "CONFIRMADO",
          ...(filters?.startDate || filters?.endDate ? { createdAt: dateFilter } : {}),
        },
      }),
      this.prisma.client.count({ where: { status: "ACTIVO" } }),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.lot.count({ where: { status: "DISPONIBLE" } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { notIn: ["CANCELADO", "RECHAZADO"] },
          createdAt: { gte: thisMonth },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { notIn: ["CANCELADO", "RECHAZADO"] },
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
    ]);

    const currentRevenue = Number(monthlyRevenue._sum.totalAmount ?? 0);
    const prevRevenue = Number(lastMonthRevenue._sum.totalAmount ?? 0);
    const revenueChange = prevRevenue > 0
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
      : 0;

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalClients,
      totalProducts,
      totalLots,
      monthlyRevenue: currentRevenue,
      revenueChange,
    };
  }

  async getOrdersByStatus(filters?: { startDate?: string; endDate?: string }) {
    const dateFilter: any = {};
    if (filters?.startDate) dateFilter.gte = new Date(filters.startDate);
    if (filters?.endDate) dateFilter.lte = new Date(filters.endDate);

    const where = filters?.startDate || filters?.endDate ? { createdAt: dateFilter } : {};

    const result = await this.prisma.order.groupBy({
      by: ["status"],
      _count: true,
      where,
      orderBy: { _count: { status: "desc" } },
    });

    return result.map((r) => ({ status: r.status, count: r._count }));
  }

  async getOrdersRecent(limit = 10) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { company: true } },
        items: {
          include: { product: { select: { name: true, type: true } } },
        },
      },
    });
  }

  async getSalesByProduct(filters?: { startDate?: string; endDate?: string }) {
    const dateFilter: any = {};
    if (filters?.startDate) dateFilter.gte = new Date(filters.startDate);
    if (filters?.endDate) dateFilter.lte = new Date(filters.endDate);

    const where: any = {
      order: {
        status: { notIn: ["CANCELADO", "RECHAZADO"] },
        ...(filters?.startDate || filters?.endDate ? { createdAt: dateFilter } : {}),
      },
    };

    const result = await this.prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, unitPrice: true },
      _count: true,
      where,
    });

    const productIds = result.map((r) => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, type: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return result.map((r) => {
      const product = productMap.get(r.productId);
      const totalQty = Number(r._sum?.quantity ?? 0);
      const totalRevenue = Number(r._sum?.unitPrice ?? 0) * totalQty;
      return {
        productId: r.productId,
        productName: product?.name ?? "Unknown",
        productType: product?.type ?? "Unknown",
        totalQuantity: totalQty,
        totalRevenue,
        orderCount: r._count,
      };
    });
  }

  async getSalesMonthly() {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
      months.push({ label, start: d, end });
    }

    const results = await Promise.all(
      months.map(async (m) => {
        const agg = await this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          _count: true,
          where: {
            status: { notIn: ["CANCELADO", "RECHAZADO"] },
            createdAt: { gte: m.start, lte: m.end },
          },
        });
        return {
          month: m.label,
          revenue: Number(agg._sum.totalAmount ?? 0),
          orders: agg._count,
        };
      }),
    );

    return results;
  }

  async getQualitySummary() {
    const [analyses, lotCounts] = await Promise.all([
      this.prisma.qualityAnalysis.aggregate({
        _avg: { totalScore: true },
        _min: { totalScore: true },
        _max: { totalScore: true },
        _count: true,
      }),
      this.prisma.qualityAnalysis.groupBy({
        by: ["lotId"],
        _avg: { totalScore: true },
        where: { totalScore: { gte: 80 } },
      }),
    ]);

    const distribution = await this.prisma.$queryRaw<
      { range: string; count: bigint }[]
    >`
      SELECT
        CASE
          WHEN "totalScore" >= 90 THEN '90+'
          WHEN "totalScore" >= 80 THEN '80-89'
          WHEN "totalScore" >= 70 THEN '70-79'
          ELSE '<70'
        END as range,
        COUNT(*) as count
      FROM "QualityAnalysis"
      GROUP BY range
      ORDER BY range DESC
    `;

    return {
      averageScore: Number(analyses._avg.totalScore ?? 0),
      minScore: Number(analyses._min.totalScore ?? 0),
      maxScore: Number(analyses._max.totalScore ?? 0),
      totalAnalyses: analyses._count,
      lotsAbove80: lotCounts.length,
      distribution: distribution.map((d) => ({
        range: d.range,
        count: Number(d.count),
      })),
    };
  }

  async getTopClients(limit = 5) {
    const result = await this.prisma.order.groupBy({
      by: ["clientId"],
      _sum: { totalAmount: true },
      _count: true,
      where: {
        status: { notIn: ["CANCELADO", "RECHAZADO"] },
      },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: limit,
    });

    const clientIds = result.map((r) => r.clientId);
    const clients = await this.prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, company: true, country: true },
    });
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    return result.map((r) => {
      const client = clientMap.get(r.clientId);
      return {
        clientId: r.clientId,
        company: client?.company ?? "Unknown",
        country: client?.country ?? "Unknown",
        totalRevenue: Number(r._sum?.totalAmount ?? 0),
        orderCount: r._count,
      };
    });
  }

  async getTopProducts(limit = 5) {
    const result = await this.prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, unitPrice: true },
      _count: true,
      where: {
        order: { status: { notIn: ["CANCELADO", "RECHAZADO"] } },
      },
      orderBy: { _count: { productId: "desc" } },
      take: limit,
    });

    const productIds = result.map((r) => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, type: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return result.map((r) => {
      const product = productMap.get(r.productId);
      const totalQty = Number(r._sum?.quantity ?? 0);
      const avgPrice = Number(r._sum?.unitPrice ?? 0);
      return {
        productId: r.productId,
        productName: product?.name ?? "Unknown",
        productType: product?.type ?? "Unknown",
        totalQuantity: totalQty,
        totalRevenue: avgPrice * totalQty,
        orderCount: r._count,
      };
    });
  }

  async getTrends() {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
      months.push({ label, start: d, end });
    }

    const results = await Promise.all(
      months.map(async (m) => {
        const [orders, revenue] = await Promise.all([
          this.prisma.order.count({
            where: {
              status: { notIn: ["CANCELADO", "RECHAZADO"] },
              createdAt: { gte: m.start, lte: m.end },
            },
          }),
          this.prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: {
              status: { notIn: ["CANCELADO", "RECHAZADO"] },
              createdAt: { gte: m.start, lte: m.end },
            },
          }),
        ]);
        return {
          month: m.label,
          orders,
          revenue: Number(revenue._sum.totalAmount ?? 0),
        };
      }),
    );

    return results;
  }
}
