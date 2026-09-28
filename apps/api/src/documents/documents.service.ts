import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { readFile } from "fs/promises";
import { isAbsolute, join, resolve, sep } from "path";

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  async create(data: {
    orderId: string;
    type: string;
    number: string;
    issuedBy?: string;
    issuedAt?: Date;
    expiresAt?: Date;
    notes?: string;
    metadata?: Record<string, any>;
  }) {
    // Validate unique document number
    const existing = await this.prisma.document.findUnique({
      where: { number: data.number },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un documento con número ${data.number}`);
    }

    // Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, orderNumber: true },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");

    return this.prisma.document.create({
      data: {
        orderId: data.orderId,
        type: data.type as any,
        number: data.number,
        issuedBy: data.issuedBy,
        issuedAt: data.issuedAt,
        expiresAt: data.expiresAt,
        notes: data.notes,
        metadata: data.metadata,
      },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        shipment: { include: { destination: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.document.findMany({
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        shipment: { include: { destination: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            client: { select: { company: true, country: true } },
          },
        },
        shipment: { include: { destination: true } },
      },
    });
    if (!doc) throw new NotFoundException("Documento no encontrado");
    return doc;
  }

  async readStoredFile(id: string) {
    const document = await this.findOne(id);
    if (!document.fileUrl || isAbsolute(document.fileUrl) || document.fileUrl.includes("..")) {
      throw new NotFoundException("El documento no tiene un archivo almacenado");
    }
    const storageRoot = process.env.RITECH_UPLOAD_DIR || join(process.cwd(), "storage");
    const root = resolve(storageRoot);
    const filePath = resolve(root, document.fileUrl);
    if (!filePath.startsWith(`${root}${sep}`)) {
      throw new NotFoundException("Ruta de archivo inválida");
    }
    return { document, buffer: await readFile(filePath) };
  }

  async findByOrder(orderId: string) {
    return this.prisma.document.findMany({
      where: { orderId },
      include: { shipment: { include: { destination: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByType(type: string) {
    return this.prisma.document.findMany({
      where: { type: type as any },
      include: {
        order: { select: { id: true, orderNumber: true } },
        shipment: { include: { destination: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: {
    status?: string;
    issuedBy?: string;
    issuedAt?: Date;
    expiresAt?: Date;
    fileUrl?: string;
    notes?: string;
  }) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException("Documento no encontrado");

    return this.prisma.document.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status as any }),
        ...(data.issuedBy && { issuedBy: data.issuedBy }),
        ...(data.issuedAt && { issuedAt: data.issuedAt }),
        ...(data.expiresAt && { expiresAt: data.expiresAt }),
        ...(data.fileUrl && { fileUrl: data.fileUrl }),
        ...(data.notes && { notes: data.notes }),
      },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
      },
    });
  }

  async generatePdf(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            client: true,
            items: {
              include: { product: true, lot: true },
            },
          },
        },
      },
    });
    if (!doc) throw new NotFoundException("Documento no encontrado");

    // TODO(RITECH-28): Integrar librería real de generación de PDF (pdfkit/puppeteer)
    // Por ahora retorna los datos que irían en el PDF
    return {
      document: doc,
      pdfData: {
        title: `Certificado de ${doc.type} - ${doc.number}`,
        orderNumber: doc.order.orderNumber,
        client: doc.order.client?.company,
        country: doc.order.client?.country,
        items: doc.order.items.map((item) => ({
          product: item.product.name,
          variety: item.product.variety,
          quantity: item.quantity,
          lot: item.lot?.traceabilityCode,
        })),
        issuedBy: doc.issuedBy,
        issuedAt: doc.issuedAt,
        expiresAt: doc.expiresAt,
      },
      message: "TODO(RITECH-28): Generación de PDF pendiente de integrar",
    };
  }

  async generateProformaPdf(orderId: string, validUntil: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        items: { include: { product: true, lot: true } },
      },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");

    const validUntilDate = new Date(validUntil);
    if (Number.isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
      throw new ConflictException("La vigencia debe ser una fecha futura válida");
    }

    let invoice = await this.prisma.invoice.findFirst({
      where: { orderId, type: "PROFORMA" },
      orderBy: { createdAt: "desc" },
    });
    if (invoice) {
      invoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { validUntil: validUntilDate },
      });
    } else {
      const year = new Date().getFullYear();
      const count = await this.prisma.invoice.count({
        where: { type: "PROFORMA" },
      });
      invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber: `PI-${year}-${String(count + 1).padStart(5, "0")}`,
          orderId,
          type: "PROFORMA",
          amount: order.totalAmount ?? 0,
          currency: order.currency,
          validUntil: validUntilDate,
        },
      });
    }

    const PDFDocument = require("pdfkit");
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 48, size: "A4" });
      const chunks: Buffer[] = [];
      pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdf.on("end", () => resolve(Buffer.concat(chunks)));
      pdf.on("error", reject);

      pdf.font("Helvetica-Bold").fontSize(22).fillColor("#102b46").text("PROFORMA INVOICE");
      pdf.moveDown(0.35);
      pdf.font("Helvetica").fontSize(10).fillColor("#475569");
      pdf.text(`Número: ${invoice.invoiceNumber}`);
      pdf.text(`Pedido: ${order.orderNumber}`);
      pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-CO")}`);
      pdf.text(`Válida hasta: ${validUntilDate.toLocaleDateString("es-CO")}`);
      pdf.moveDown();
      pdf.font("Helvetica-Bold").fontSize(12).fillColor("#102b46").text("Cliente");
      pdf.font("Helvetica").fontSize(10).fillColor("#1e293b");
      pdf.text(order.client.company);
      pdf.text(`${order.client.address}, ${order.client.country}`);
      pdf.text(`VAT ID: ${order.client.vatId}`);
      pdf.moveDown();
      pdf.font("Helvetica-Bold").fontSize(12).fillColor("#102b46").text("Detalle del pedido");
      pdf.moveDown(0.5);

      const tableX = 48;
      const widths = [190, 76, 52, 80, 100];
      const headers = ["Producto", "Lote", "Cantidad", "Precio unitario", "Importe"];
      let y = pdf.y;
      let x = tableX;
      pdf.font("Helvetica-Bold").fontSize(8).fillColor("#334155");
      headers.forEach((header, index) => {
        pdf.text(header, x, y, { width: widths[index], align: index > 1 ? "right" : "left" });
        x += widths[index];
      });
      y += 18;
      pdf.moveTo(tableX, y).lineTo(547, y).strokeColor("#cbd5e1").stroke();
      y += 8;
      let total = 0;
      pdf.font("Helvetica").fontSize(9).fillColor("#1e293b");
      for (const item of order.items) {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const amount = quantity * unitPrice;
        total += amount;
        const row = [
          `${item.product.name} · ${item.product.variety}`,
          item.lot?.traceabilityCode ?? "—",
          `${quantity.toLocaleString("es-CO")} kg`,
          `${order.currency} ${unitPrice.toFixed(2)}`,
          `${order.currency} ${amount.toFixed(2)}`,
        ];
        x = tableX;
        row.forEach((value, index) => {
          pdf.text(value, x, y, { width: widths[index], align: index > 1 ? "right" : "left" });
          x += widths[index];
        });
        y += 28;
        if (y > 700) {
          pdf.addPage();
          y = 48;
        }
      }
      pdf.moveTo(tableX, y).lineTo(547, y).strokeColor("#cbd5e1").stroke();
      pdf.moveDown(1.5);
      pdf.font("Helvetica-Bold").fontSize(12).fillColor("#102b46");
      pdf.text(`Total: ${order.currency} ${total.toFixed(2)}`, tableX, y + 12, { align: "right", width: 499 });
      pdf.moveDown(2);
      pdf.font("Helvetica").fontSize(9).fillColor("#475569");
      pdf.text(`Incoterm: ${order.incoterm}`);
      pdf.text("Documento preliminar sujeto a aprobación del pedido y confirmación comercial.");
      pdf.end();
    });
  }

  async emailProforma(orderId: string, validUntil: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });
    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (!order.client.email) {
      throw new ConflictException("El cliente no tiene un correo registrado");
    }

    const pdf = await this.generateProformaPdf(orderId, validUntil);
    const invoice = await this.prisma.invoice.findFirst({
      where: { orderId, type: "PROFORMA" },
      orderBy: { createdAt: "desc" },
    });
    if (!invoice) throw new NotFoundException("No se encontró la proforma generada");

    const sent = await this.emailService.sendMail({
      to: order.client.email,
      subject: `RiTech · Proforma ${invoice.invoiceNumber} · ${order.orderNumber}`,
      text: `Se adjunta la proforma ${invoice.invoiceNumber} correspondiente al pedido ${order.orderNumber}.`,
      html: `<p>Se adjunta la proforma <strong>${invoice.invoiceNumber}</strong> correspondiente al pedido <strong>${order.orderNumber}</strong>.</p>`,
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" }],
    });

    return {
      sent,
      invoiceNumber: invoice.invoiceNumber,
      message: sent ? "La proforma se envió al correo registrado del cliente." : "SMTP no está configurado; descarga el PDF y compártelo manualmente.",
    };
  }
}
