import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import Stripe from "stripe";

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-07-29.dahlia",
    });
  }

  async createCheckoutSession(
    orderId: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    if (!order) throw new BadRequestException("Pedido no encontrado");
    if (order.status === "CANCELADO")
      throw new BadRequestException("No se puede pagar un pedido cancelado");
    if (order.paymentStatus === "COMPLETADO")
      throw new BadRequestException("El pedido ya fue pagado");

    if (!order.items.length)
      throw new BadRequestException("El pedido no tiene items");

    // Build Stripe line items from order items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: `${item.product.name} — ${item.product.variety}`,
            description: `Origen: ${item.product.origin} | Variedad: ${item.product.variety}`,
          },
          unit_amount: Math.round(Number(item.unitPrice) * 100), // Stripe uses cents
        },
        quantity: Math.round(Number(item.quantity)),
      }));

    // Calculate total for storage
    let totalAmount = 0;
    for (const item of order.items) {
      totalAmount += Number(item.quantity) * Number(item.unitPrice);
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: order.client.email || undefined,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      success_url:
        successUrl || `http://localhost:3000/orders?paid=${order.id}`,
      cancel_url:
        cancelUrl || `http://localhost:3000/orders?cancelled=${order.id}`,
    });

    // Store session ID and update payment status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        stripeSessionId: session.id,
        paymentStatus: "PROCESANDO",
        totalAmount,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException("Webhook signature verification failed");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "COMPLETADO",
            status: "CONFIRMADO",
            paidAt: new Date(),
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
          },
        });
        this.logger.log(`Payment completed for order ${orderId}`);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FALLIDO" },
        });
        this.logger.log(`Payment expired for order ${orderId}`);
      }
    }

    return { received: true };
  }

  async getPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        stripeSessionId: true,
        paidAt: true,
        totalAmount: true,
        currency: true,
      },
    });

    if (!order) throw new BadRequestException("Pedido no encontrado");
    return order;
  }
}
