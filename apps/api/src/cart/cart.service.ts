import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { isNarinoOrigin } from "../products/origin-policy";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addItem(data: {
    sessionId: string;
    productId: string;
    lotId?: string;
    quantity: number;
    unitPrice: number;
    currency?: string;
  }) {
    // Validate minimum 100kg for coffee
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      select: { type: true, name: true, origin: true, active: true },
    });
    if (!product) throw new NotFoundException("Producto no encontrado");
    if (!product.active || !isNarinoOrigin(product.origin)) {
      throw new BadRequestException("El carrito solo admite productos activos con origen en Nariño.");
    }

    if (product.type === "CAFE" && data.quantity < 100) {
      throw new BadRequestException(
        "La cantidad mínima de exportación para café es 100 kg",
      );
    }

    // Check if item already exists in cart (upsert)
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        sessionId: data.sessionId,
        productId: data.productId,
        lotId: data.lotId ?? null,
      },
    });

    if (existing) {
      const newQty = Number(existing.quantity) + data.quantity;
      if (product.type === "CAFE" && newQty < 100) {
        throw new BadRequestException(
          "La cantidad mínima de exportación para café es 100 kg",
        );
      }
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty, unitPrice: data.unitPrice },
        include: { product: { select: { id: true, name: true, type: true } } },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        sessionId: data.sessionId,
        productId: data.productId,
        lotId: data.lotId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        currency: (data.currency as any) || "EUR",
      },
      include: { product: { select: { id: true, name: true, type: true } } },
    });
  }

  async getCart(sessionId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { sessionId },
      include: {
        product: { select: { id: true, name: true, type: true, variety: true, origin: true } },
        lot: { select: { id: true, traceabilityCode: true, weight: true } },
      },
      orderBy: { id: "asc" },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );

    return {
      items,
      itemCount: items.length,
      subtotal,
      currency: items[0]?.currency || "EUR",
    };
  }

  async updateQuantity(itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: { select: { type: true, origin: true, active: true } } },
    });
    if (!item) throw new NotFoundException("Item no encontrado en el carrito");
    if (!item.product.active || !isNarinoOrigin(item.product.origin)) {
      throw new BadRequestException("El carrito solo admite productos activos con origen en Nariño.");
    }

    if (item.product.type === "CAFE" && quantity < 100) {
      throw new BadRequestException(
        "La cantidad mínima de exportación para café es 100 kg",
      );
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: { select: { id: true, name: true, type: true } } },
    });
  }

  async removeItem(itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException("Item no encontrado en el carrito");
    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(sessionId: string) {
    return this.prisma.cartItem.deleteMany({ where: { sessionId } });
  }
}
