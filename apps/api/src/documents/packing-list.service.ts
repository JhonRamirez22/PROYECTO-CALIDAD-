import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";

type PackingOrder = {
  id: string;
  orderNumber: string;
  shipmentOrders: { shipment: { id: string } }[];
  items: {
    product: { name: string };
    lot: { traceabilityCode: string } | null;
    packageCount: number | null;
    quantity: Prisma.Decimal;
    grossWeight: Prisma.Decimal | null;
    dimensions: string | null;
    marks: string | null;
  }[];
};

@Injectable()
export class PackingListService {
  constructor(private prisma: PrismaService) {}

  async generatePackingList(orderId: string): Promise<Buffer> {
    const PDFDocument = require("pdfkit");
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        seller: { select: { id: true, email: true } },
        items: { include: { product: true, lot: true } },
        shipmentOrders: { include: { shipment: { select: { id: true } } } },
      },
    });

    if (!order) throw new NotFoundException("Pedido no encontrado");
    if (!["CONFIRMADO", "ENVIADO", "ENTREGADO"].includes(order.status)) {
      throw new BadRequestException("Apruebe el pedido antes de generar el packing list");
    }
    if (order.shipmentOrders.length === 0) {
      throw new BadRequestException("Asocie el pedido a un envío antes de generar el packing list");
    }
    const incomplete = order.items.find(
      (item) => item.packageCount == null || item.grossWeight == null || !item.dimensions?.trim(),
    );
    if (incomplete) {
      throw new BadRequestException(
        "Complete bultos, peso bruto y dimensiones de cada producto antes de generar el packing list",
      );
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        const pdf = Buffer.concat(chunks);
        void this.persistVersion(order, pdf).then(() => resolve(pdf)).catch(reject);
      });
      doc.on("error", reject);

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("PACKING LIST", { align: "center" });
      doc.moveDown(0.5);

      // Order info
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`N° Pedido: ${order.orderNumber}`);
      doc.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString("es-CO")}`);
      doc.text(`Estado: ${order.status}`);
      doc.moveDown();

      // Client info
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Información del Cliente");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Empresa: ${order.client.company || "N/A"}`);
      doc.text(`País: ${order.client.country || "N/A"}`);
      doc.moveDown();

      // Items table
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Detalle de Productos");
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const colWidths = [112, 82, 42, 60, 60, 95, 64];
      const headers = ["Producto", "Lote", "Bultos", "Neto kg", "Bruto kg", "Dimensiones", "Marcas"];

      let x = 40;
      doc.font("Helvetica-Bold").fontSize(8);
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: "left" });
        x += colWidths[i];
      });

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font("Helvetica").fontSize(9);
      let totalNet = 0;
      let totalGross = 0;
      let missingGrossWeight = false;

      order.items.forEach((item) => {
        const y = doc.y;
        x = 40;
        const weight = Number(item.quantity);
        const grossWeight = item.grossWeight == null ? null : Number(item.grossWeight);
        totalNet += weight;
        if (grossWeight == null) missingGrossWeight = true;
        else totalGross += grossWeight;

        const rowData = [
          item.product.name || "N/A",
          item.lot?.traceabilityCode || "N/A",
          item.packageCount?.toString() || "—",
          weight.toFixed(2),
          grossWeight?.toFixed(2) || "Pendiente",
          item.dimensions || "Pendiente",
          item.marks || "—",
        ];

        rowData.forEach((text, i) => {
          doc.text(text, x, y, { width: colWidths[i], align: "left" });
          x += colWidths[i];
        });
        doc.moveDown(0.8);
      });

      // Totals
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Peso Neto Total: ${totalNet.toFixed(2)} kg`, 40, doc.y, {
          align: "right",
          width: 515,
        });
      doc.text(
        missingGrossWeight
          ? "Peso bruto total: completar datos de embalaje"
          : `Peso Bruto Total: ${totalGross.toFixed(2)} kg`,
        40,
        doc.y,
        { align: "right", width: 515 }
      );
      doc.moveDown();

      // Notes
      if (order.notes) {
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Notas:");
        doc.font("Helvetica").text(order.notes);
        doc.moveDown();
      }

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Generado: ${new Date().toLocaleString("es-CO")} | RiTech SAS - Exportación de Café y Cacao`,
          40,
          doc.y,
          { align: "center", width: 515 }
        );

      doc.end();
    });
  }

  private async persistVersion(order: PackingOrder, pdf: Buffer) {
    const storageRoot = process.env.RITECH_UPLOAD_DIR || join(process.cwd(), "storage");
    const folder = join(storageRoot, "documents", "packing-lists");
    await mkdir(folder, { recursive: true });
    const safeOrderNumber = order.orderNumber.replace(/[^A-Za-z0-9_-]/g, "_");
    const fileName = `packing-${safeOrderNumber}-${randomUUID()}.pdf`;
    const absolutePath = join(folder, fileName);
    const fileUrl = `documents/packing-lists/${fileName}`;
    await writeFile(absolutePath, pdf, { flag: "wx" });

    try {
      const versions = await this.prisma.document.count({ where: { orderId: order.id, type: "PACKING_LIST" } });
      const number = `PL-${safeOrderNumber}-${String(versions + 1).padStart(2, "0")}`;
      await this.prisma.document.create({
        data: {
          orderId: order.id,
          shipmentId: order.shipmentOrders[0]?.shipment.id ?? null,
          type: "PACKING_LIST",
          number,
          status: "GENERADO",
          issuedBy: "RiTech Export Desk",
          issuedAt: new Date(),
          fileUrl,
          metadata: {
            version: versions + 1,
            packageLines: order.items.map((item) => ({
              product: item.product.name,
              traceabilityCode: item.lot?.traceabilityCode ?? null,
              packageCount: item.packageCount,
              netWeight: Number(item.quantity),
              grossWeight: Number(item.grossWeight),
              dimensions: item.dimensions,
              marks: item.marks,
            })),
          },
        },
      });
    } catch (error) {
      await unlink(absolutePath).catch(() => undefined);
      throw error;
    }
  }
}
