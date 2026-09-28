import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto, OrderFilterDto } from "./dto/order.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType, NotificationPriority, UserRole } from "@prisma/client";

const DEFAULT_COMMISSION_PERCENTAGE = 1;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count();
    return `REQ-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  private async requireActiveContract(clientId: string) {
    const now = new Date();
    const contract = await this.prisma.clientContract.findFirst({
      where: {
        clientId,
        status: "ACTIVO",
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });
    if (!contract) {
      throw new BadRequestException("El cliente necesita un contrato activo antes de crear el pedido");
    }
    return contract;
  }

  async create(dto: CreateOrderDto, userId?: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) throw new NotFoundException("Cliente no encontrado");
    if (client.status !== "ACTIVO") {
      throw new BadRequestException("El cliente no está activo");
    }
    await this.requireActiveContract(dto.clientId);

    // Validate and reserve lots
    const lotIds = dto.items
      .filter((item) => item.lotId)
      .map((item) => item.lotId as string);
    const lots = await this.prisma.lot.findMany({
      where: { id: { in: lotIds } },
    });

    const quantityByLot = new Map<string, number>();
    for (const item of dto.items) {
      if (item.lotId) {
        quantityByLot.set(
          item.lotId,
          (quantityByLot.get(item.lotId) ?? 0) + item.quantity,
        );
      }
    }

    for (const item of dto.items) {
      if (!item.lotId) continue;
      const lot = lots.find((l) => l.id === item.lotId);
      if (!lot) {
        throw new NotFoundException(`Lote ${item.lotId} no encontrado`);
      }
      if (lot.status !== "DISPONIBLE") {
        throw new BadRequestException(
          `El lote ${lot.traceabilityCode} no está disponible (estado: ${lot.status})`
        );
      }
      if (lot.productId !== item.productId) {
        throw new BadRequestException(
          `El lote ${lot.traceabilityCode} no pertenece al producto seleccionado`
        );
      }
      if (lot.weight.lessThan(quantityByLot.get(item.lotId) ?? item.quantity)) {
        throw new BadRequestException(
          `El lote ${lot.traceabilityCode} tiene ${lot.weight} kg, pero se solicitan ${quantityByLot.get(item.lotId) ?? item.quantity} kg`
        );
      }
    }

    const orderNumber = await this.generateOrderNumber();

    let totalAmount = 0;
    for (const item of dto.items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        clientId: dto.clientId,
        sellerId: dto.sellerId || null,
        status: "BORRADOR",
        incoterm: (dto.incoterm as any) || "FOB",
        currency: (dto.currency as any) || "EUR",
        notes: dto.notes,
        totalAmount,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            lotId: item.lotId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            packageCount: item.packageCount,
            grossWeight: item.grossWeight,
            dimensions: item.dimensions,
            marks: item.marks,
          })),
        },
      },
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true, lot: true } },
      },
    });

    // Reserve lots
    for (const item of dto.items) {
      if (!item.lotId) continue;
      await this.prisma.lot.update({
        where: { id: item.lotId },
        data: { status: "RESERVADO" },
      });
      const lot = lots.find((candidate) => candidate.id === item.lotId);
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          module: "lots",
          entityId: item.lotId,
          oldValues: { status: "DISPONIBLE" },
          newValues: {
            event: "ORDER_LOT_ASSIGNED",
            orderId: order.id,
            orderNumber: order.orderNumber,
            traceabilityCode: lot?.traceabilityCode ?? null,
            quantity: item.quantity,
          },
        },
      });
    }

    if (dto.sellerId) {
      const commissionAmount =
        totalAmount * (DEFAULT_COMMISSION_PERCENTAGE / 100);
      await this.prisma.commission.create({
        data: {
          orderId: order.id,
          sellerId: dto.sellerId,
          amount: commissionAmount,
          percentage: DEFAULT_COMMISSION_PERCENTAGE,
        },
      });
    }

    return order;
  }

  async submitForApproval(id: string) {
    const order = await this.findOne(id);
    if (order.status !== "BORRADOR") {
      throw new BadRequestException("Solo se pueden enviar a aprobación pedidos en borrador");
    }
    await this.requireActiveContract(order.clientId);
    const submitted = await this.prisma.order.update({
      where: { id },
      data: { status: "PENDIENTE_APROBACION", rejectReason: null, approvedById: null, approvedAt: null },
      include: { client: true, items: { include: { product: true, lot: true } } },
    });
    const reviewers = await this.prisma.user.findMany({
      where: { active: true, roles: { hasSome: [UserRole.ADMIN, UserRole.GERENTE] } },
      select: { id: true },
    });
    await Promise.all(reviewers.map((reviewer) => this.notificationsService.create({
      userId: reviewer.id,
      type: NotificationType.ORDER_STATUS_CHANGE,
      title: `Pedido pendiente: ${submitted.orderNumber}`,
      message: `El pedido de ${submitted.client.company} espera revisión y aprobación.`,
      priority: NotificationPriority.HIGH,
      link: `/orders/${submitted.id}`,
      metadata: { orderId: submitted.id, orderNumber: submitted.orderNumber, newStatus: "PENDIENTE_APROBACION" },
    })));
    return submitted;
  }

  async updateItemLot(orderId: string, itemId: string, lotId: string, userId?: string) {
    const order = await this.findOne(orderId);
    if (!["BORRADOR", "PENDIENTE_APROBACION"].includes(order.status)) {
      throw new BadRequestException("El lote solo se puede cambiar antes de aprobar el pedido");
    }
    const item = order.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Línea de pedido no encontrada");
    if (item.lotId === lotId) return order;

    const nextLot = await this.prisma.lot.findUnique({ where: { id: lotId } });
    if (!nextLot) throw new NotFoundException("Lote no encontrado");
    if (nextLot.status !== "DISPONIBLE") throw new BadRequestException("El lote seleccionado no está disponible");
    if (nextLot.productId !== item.productId) throw new BadRequestException("El lote seleccionado pertenece a otro producto");
    if (nextLot.weight.lessThan(item.quantity)) throw new BadRequestException("El lote no tiene peso suficiente para esta línea");

    const oldLotId = item.lotId;
    const oldTraceabilityCode = item.lot?.traceabilityCode ?? null;
    await this.prisma.orderItem.update({ where: { id: itemId }, data: { lotId } });
    await this.prisma.lot.update({ where: { id: lotId }, data: { status: "RESERVADO" } });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        module: "lots",
        entityId: lotId,
        oldValues: { status: "DISPONIBLE" },
        newValues: {
          event: "ORDER_LOT_ASSIGNED",
          orderId: order.id,
          orderNumber: order.orderNumber,
          previousTraceabilityCode: oldTraceabilityCode,
          traceabilityCode: nextLot.traceabilityCode,
          quantity: Number(item.quantity),
        },
      },
    });

    if (oldLotId) {
      const remainingReferences = await this.prisma.orderItem.count({ where: { lotId: oldLotId } });
      if (remainingReferences === 0) {
        await this.prisma.lot.updateMany({ where: { id: oldLotId, status: "RESERVADO" }, data: { status: "DISPONIBLE" } });
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: "UPDATE",
            module: "lots",
            entityId: oldLotId,
            oldValues: { status: "RESERVADO" },
            newValues: {
              event: "ORDER_LOT_RELEASED",
              orderId: order.id,
              orderNumber: order.orderNumber,
              previousTraceabilityCode: oldTraceabilityCode,
              replacementTraceabilityCode: nextLot.traceabilityCode,
            },
          },
        });
      }
    }
    return this.findOne(orderId);
  }

  async updatePackingDetails(orderId: string, itemId: string, data: { packageCount: number; grossWeight: number; dimensions: string; marks?: string }) {
    const order = await this.findOne(orderId);
    if (["ENVIADO", "ENTREGADO", "CANCELADO", "RECHAZADO"].includes(order.status)) {
      throw new BadRequestException("El embalaje no se puede editar después del despacho o cierre del pedido");
    }
    const item = order.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Línea de pedido no encontrada");
    if (data.grossWeight < Number(item.quantity)) {
      throw new BadRequestException("El peso bruto no puede ser menor que el peso neto");
    }
    await this.prisma.orderItem.update({ where: { id: itemId }, data });
    return this.findOne(orderId);
  }

  async findAll(filters?: OrderFilterDto) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.sellerId) where.sellerId = filters.sellerId;

    return this.prisma.order.findMany({
      where,
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true } },
        commission: true,
        _count: { select: { items: true, invoices: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: { include: { contacts: true } },
        seller: { select: { id: true, email: true } },
        items: { include: { product: true, lot: true } },
        invoices: true,
        documents: { orderBy: { createdAt: "desc" } },
        commission: true,
        logistics: true,
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    return order;
  }

  async approve(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== "PENDIENTE_APROBACION") {
      throw new BadRequestException(
        "Solo se pueden aprobar pedidos pendientes de aprobación"
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: "CONFIRMADO",
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true } },
      },
    });

    // Notify client
    if (updatedOrder.client?.userId) {
      await this.notificationsService.create({
        userId: updatedOrder.client.userId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: "Pedido aprobado",
        message: `Su pedido ${updatedOrder.orderNumber} ha sido aprobado y está confirmado`,
        priority: NotificationPriority.HIGH,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "CONFIRMADO" },
      });
    }

    // Notify seller
    if (updatedOrder.seller?.id) {
      await this.notificationsService.create({
        userId: updatedOrder.seller.id,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: `Pedido ${updatedOrder.orderNumber} aprobado`,
        message: `El pedido ${updatedOrder.orderNumber} del cliente ${updatedOrder.client?.company || "N/A"} ha sido aprobado`,
        priority: NotificationPriority.MEDIUM,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "CONFIRMADO" },
      });
    }

    return updatedOrder;
  }

  async reject(id: string, userId: string, reason: string) {
    const order = await this.findOne(id);
    if (order.status !== "PENDIENTE_APROBACION") {
      throw new BadRequestException(
        "Solo se pueden rechazar pedidos pendientes de aprobación"
      );
    }

    // Release reserved lots
    await this.releaseLots(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: "BORRADOR",
        approvedById: userId,
        approvedAt: new Date(),
        rejectReason: reason,
      },
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true } },
      },
    });

    // Notify client
    if (updatedOrder.client?.userId) {
      await this.notificationsService.create({
        userId: updatedOrder.client.userId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: "Pedido rechazado",
        message: `Su pedido ${updatedOrder.orderNumber} ha sido rechazado. Motivo: ${reason}`,
        priority: NotificationPriority.HIGH,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "RECHAZADO", reason },
      });
    }

    // Notify seller
    if (updatedOrder.seller?.id) {
      await this.notificationsService.create({
        userId: updatedOrder.seller.id,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: `Pedido ${updatedOrder.orderNumber} rechazado`,
        message: `El pedido ${updatedOrder.orderNumber} del cliente ${updatedOrder.client?.company || "N/A"} ha sido rechazado`,
        priority: NotificationPriority.HIGH,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "RECHAZADO", reason },
      });
    }

    return updatedOrder;
  }

  async updateStatus(id: string, status: string, reason?: string) {
    const order = await this.findOne(id);
    const terminalStatuses = ["ENTREGADO", "CANCELADO"];
    if (terminalStatuses.includes(order.status)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de un pedido en estado ${order.status}`
      );
    }

    if (order.status === status) {
      throw new BadRequestException("El pedido ya está en ese estado");
    }

    if (status === "CANCELADO" || status === "RECHAZADO") {
      await this.releaseLots(id);
    }

    if (status === "ENVIADO" && order.status === "CONFIRMADO") {
      const lotIds = order.items
        .filter((item) => item.lotId)
        .map((item) => item.lotId as string);
      if (lotIds.length > 0) {
        await this.prisma.lot.updateMany({
          where: { id: { in: lotIds } },
          data: { status: "ENVIADO" },
        });
      }
    }

    const updateData: any = { status: status as any };
    if (reason) updateData.rejectReason = reason;

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true, lot: true } },
      },
    });

    // Create notification for status change
    const statusLabels: Record<string, string> = {
      BORRADOR: "Borrador",
      PENDIENTE_APROBACION: "Pendiente de Aprobación",
      CONFIRMADO: "Confirmado",
      RECHAZADO: "Rechazado",
      ENVIADO: "Enviado",
      ENTREGADO: "Entregado",
      CANCELADO: "Cancelado",
    };

    // Notify client
    if (updatedOrder.client?.userId) {
      await this.notificationsService.create({
        userId: updatedOrder.client.userId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: `Estado del pedido actualizado: ${statusLabels[status] || status}`,
        message: `Su pedido ${updatedOrder.orderNumber} ahora está en estado "${statusLabels[status] || status}"`,
        priority: NotificationPriority.MEDIUM,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: status },
      });
    }

    // Notify seller
    if (updatedOrder.seller?.id) {
      await this.notificationsService.create({
        userId: updatedOrder.seller.id,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: `Pedido ${updatedOrder.orderNumber} actualizado`,
        message: `El pedido ${updatedOrder.orderNumber} del cliente ${updatedOrder.client?.company || "N/A"} cambió a "${statusLabels[status] || status}"`,
        priority: NotificationPriority.MEDIUM,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: status },
      });
    }

    return updatedOrder;
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    const terminalStatuses = ["ENTREGADO", "CANCELADO"];
    if (terminalStatuses.includes(order.status)) {
      throw new BadRequestException(
        `No se puede cancelar un pedido en estado ${order.status}`
      );
    }

    // Release reserved lots
    await this.releaseLots(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: "CANCELADO" },
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true, lot: true } },
      },
    });

    // Notify client
    if (updatedOrder.client?.userId) {
      await this.notificationsService.create({
        userId: updatedOrder.client.userId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: "Pedido cancelado",
        message: `Su pedido ${updatedOrder.orderNumber} ha sido cancelado`,
        priority: NotificationPriority.HIGH,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "CANCELADO" },
      });
    }

    // Notify seller
    if (updatedOrder.seller?.id) {
      await this.notificationsService.create({
        userId: updatedOrder.seller.id,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: `Pedido ${updatedOrder.orderNumber} cancelado`,
        message: `El pedido ${updatedOrder.orderNumber} del cliente ${updatedOrder.client?.company || "N/A"} ha sido cancelado`,
        priority: NotificationPriority.HIGH,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "CANCELADO" },
      });
    }

    return updatedOrder;
  }

  async markShipped(id: string) {
    const order = await this.findOne(id);
    if (order.status !== "CONFIRMADO") {
      throw new BadRequestException(
        "Solo se pueden enviar pedidos confirmados"
      );
    }

    // Mark lots as ENVIADO
    const lotIds = order.items
      .filter((item) => item.lotId)
      .map((item) => item.lotId as string);
    if (lotIds.length > 0) {
      await this.prisma.lot.updateMany({
        where: { id: { in: lotIds } },
        data: { status: "ENVIADO" },
      });
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: "ENVIADO" },
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true, lot: true } },
      },
    });

    // Notify client
    if (updatedOrder.client?.userId) {
      await this.notificationsService.create({
        userId: updatedOrder.client.userId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: "Pedido enviado",
        message: `Su pedido ${updatedOrder.orderNumber} ha sido enviado`,
        priority: NotificationPriority.HIGH,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "ENVIADO" },
      });
    }

    // Notify seller
    if (updatedOrder.seller?.id) {
      await this.notificationsService.create({
        userId: updatedOrder.seller.id,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: `Pedido ${updatedOrder.orderNumber} enviado`,
        message: `El pedido ${updatedOrder.orderNumber} del cliente ${updatedOrder.client?.company || "N/A"} ha sido enviado`,
        priority: NotificationPriority.MEDIUM,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "ENVIADO" },
      });
    }

    return updatedOrder;
  }

  async markDelivered(id: string) {
    const order = await this.findOne(id);
    if (order.status !== "ENVIADO") {
      throw new BadRequestException(
        "Solo se pueden marcar como entregado pedidos enviados"
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: "ENTREGADO" },
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true, lot: true } },
      },
    });

    // Notify client
    if (updatedOrder.client?.userId) {
      await this.notificationsService.create({
        userId: updatedOrder.client.userId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: "Pedido entregado",
        message: `Su pedido ${updatedOrder.orderNumber} ha sido entregado exitosamente`,
        priority: NotificationPriority.MEDIUM,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "ENTREGADO" },
      });
    }

    // Notify seller
    if (updatedOrder.seller?.id) {
      await this.notificationsService.create({
        userId: updatedOrder.seller.id,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: `Pedido ${updatedOrder.orderNumber} entregado`,
        message: `El pedido ${updatedOrder.orderNumber} del cliente ${updatedOrder.client?.company || "N/A"} ha sido entregado`,
        priority: NotificationPriority.MEDIUM,
        link: `/orders/${updatedOrder.id}`,
        metadata: { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber, newStatus: "ENTREGADO" },
      });
    }

    return updatedOrder;
  }

  private async releaseLots(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const lotIds = order.items
      .filter((item) => item.lotId)
      .map((item) => item.lotId as string);
    if (lotIds.length > 0) {
      await this.prisma.lot.updateMany({
        where: { id: { in: lotIds }, status: "RESERVADO" },
        data: { status: "DISPONIBLE" },
      });
    }
  }
}
