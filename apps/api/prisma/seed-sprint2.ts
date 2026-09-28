import { randomBytes } from "crypto";
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const password = process.env.RITECH_DEMO_PASSWORD || randomBytes(15).toString("base64url");

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  const demoUsers = [
    { email: "admin@ritech.local", name: "Administración RiTech", roles: [UserRole.ADMIN] },
    { email: "gerente@ritech.local", name: "Gerencia Demo", roles: [UserRole.GERENTE] },
    { email: "operador@ritech.local", name: "Operación Demo", roles: [UserRole.OPERADOR] },
    { email: "contador@ritech.local", name: "Contabilidad Demo", roles: [UserRole.CONTADOR] },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, roles: user.roles, password: passwordHash, active: true },
      create: { ...user, password: passwordHash },
    });
  }

  const productSpecs = [
    { name: "Café de altura · Nariño", type: "CAFE" as const, variety: "Caturra", origin: "Nariño, Colombia", altitude: "1.780 m", process: "Lavado", description: "Registro sintético para demostración de catálogo." },
    { name: "Cacao fino · Nariño", type: "CACAO" as const, variety: "Criollo", origin: "Nariño, Colombia", altitude: "1.200 m", process: "Fermentado", description: "Registro sintético para demostración de catálogo." },
    { name: "Café de origen · Nariño", type: "CAFE" as const, variety: "Castillo", origin: "Nariño, Colombia", altitude: "1.650 m", process: "Natural", description: "Registro sintético para demostración de catálogo." },
  ];

  const products: { id: string }[] = [];
  for (const spec of productSpecs) {
    const existing = await prisma.product.findFirst({ where: { variety: spec.variety, origin: spec.origin } });
    products.push(existing
      ? await prisma.product.update({ where: { id: existing.id }, data: spec })
      : await prisma.product.create({ data: spec }));
  }

  const clients = await Promise.all([
    prisma.client.upsert({
      where: { vatId: "DE123456789" },
      update: { company: "Nordhafen Kaffee Demo", country: "Alemania", address: "Hafenweg 12, Hamburg", email: "compras@nordhafen.example", status: "ACTIVO" },
      create: {
        company: "Nordhafen Kaffee Demo", country: "Alemania", vatId: "DE123456789", address: "Hafenweg 12, Hamburg", email: "compras@nordhafen.example", status: "ACTIVO",
        contacts: { create: [{ name: "Contacto de compras", position: "Compras", email: "compras@nordhafen.example", role: "compras", isPrimary: true }, { name: "Contacto logístico", position: "Logística", email: "logistica@nordhafen.example", role: "logistica" }] },
      },
    }),
    prisma.client.upsert({
      where: { vatId: "NL123456789B01" },
      update: { company: "Lowland Cocoa Demo BV", country: "Países Bajos", address: "Kade 18, Rotterdam", email: "orders@lowland.example", status: "ACTIVO" },
      create: {
        company: "Lowland Cocoa Demo BV", country: "Países Bajos", vatId: "NL123456789B01", address: "Kade 18, Rotterdam", email: "orders@lowland.example", status: "ACTIVO",
        contacts: { create: [{ name: "Contacto de compras", position: "Compras", email: "orders@lowland.example", role: "compras", isPrimary: true }] },
      },
    }),
  ]);

  await Promise.all(clients.map((client, index) => {
    const contractNumber = `CTR-DEMO-${String(index + 1).padStart(3, "0")}`;
    return prisma.clientContract.upsert({
      where: { contractNumber },
      update: { clientId: client.id, status: "ACTIVO", startDate: new Date("2026-01-01T00:00:00Z"), endDate: new Date("2027-12-31T00:00:00Z") },
      create: { clientId: client.id, contractNumber, status: "ACTIVO", startDate: new Date("2026-01-01T00:00:00Z"), endDate: new Date("2027-12-31T00:00:00Z") },
    });
  }));

  const lotSpecs = [
    { traceabilityCode: "LT-DEMO-001", productId: products[0].id, weight: 240, status: "RESERVADO" as const, harvestDate: new Date("2026-02-18T00:00:00Z"), processDate: new Date("2026-02-25T00:00:00Z"), originLocation: "Finca de demostración · Nariño" },
    { traceabilityCode: "LT-DEMO-002", productId: products[1].id, weight: 320, status: "RESERVADO" as const, harvestDate: new Date("2026-03-11T00:00:00Z"), processDate: new Date("2026-03-18T00:00:00Z"), originLocation: "Finca de demostración · Nariño" },
    { traceabilityCode: "LT-DEMO-003", productId: products[2].id, weight: 180, status: "DISPONIBLE" as const, harvestDate: new Date("2026-04-06T00:00:00Z"), processDate: new Date("2026-04-12T00:00:00Z"), originLocation: "Finca de demostración · Nariño" },
    { traceabilityCode: "LT-DEMO-004", productId: products[0].id, weight: 120, status: "CERTIFICADO" as const, harvestDate: new Date("2026-04-14T00:00:00Z"), processDate: new Date("2026-04-19T00:00:00Z"), originLocation: "Finca de demostración · Nariño" },
    { traceabilityCode: "LT-DEMO-005", productId: products[2].id, weight: 160, status: "DISPONIBLE" as const, harvestDate: new Date("2026-05-02T00:00:00Z"), processDate: new Date("2026-05-08T00:00:00Z"), originLocation: "Finca de demostración · Nariño" },
  ];

  const lots: { id: string }[] = [];
  for (const spec of lotSpecs) {
    lots.push(await prisma.lot.upsert({
      where: { traceabilityCode: spec.traceabilityCode },
      update: spec,
      create: spec,
    }));
  }

  const order1 = await prisma.order.upsert({
    where: { orderNumber: "REQ-DEMO-001" },
    update: { status: "PENDIENTE_APROBACION", clientId: clients[0].id, currency: "EUR", incoterm: "FOB" },
    create: {
      orderNumber: "REQ-DEMO-001", status: "PENDIENTE_APROBACION", clientId: clients[0].id, currency: "EUR", incoterm: "FOB", totalAmount: 2040,
      items: { create: [{ productId: products[0].id, lotId: lots[0].id, quantity: 240, unitPrice: 8.5, packageCount: 12, grossWeight: 252, dimensions: "60 × 40 × 35 cm", marks: "NHD-01" }] },
    },
  });

  const order2 = await prisma.order.upsert({
    where: { orderNumber: "REQ-DEMO-002" },
    update: { status: "CONFIRMADO", clientId: clients[1].id, currency: "EUR", incoterm: "CIF" },
    create: {
      orderNumber: "REQ-DEMO-002", status: "CONFIRMADO", clientId: clients[1].id, currency: "EUR", incoterm: "CIF", totalAmount: 3840,
      items: { create: [{ productId: products[1].id, lotId: lots[1].id, quantity: 320, unitPrice: 12, packageCount: 16, grossWeight: 336, dimensions: "50 × 40 × 30 cm", marks: "LCC-02" }] },
    },
  });

  const reviewers = await prisma.user.findMany({
    where: { active: true, roles: { hasSome: [UserRole.ADMIN, UserRole.GERENTE] } },
    select: { id: true },
  });
  for (const reviewer of reviewers) {
    const title = `Pedido pendiente: ${order1.orderNumber}`;
    const exists = await prisma.notification.findFirst({ where: { userId: reviewer.id, title } });
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: reviewer.id,
          type: "ORDER_STATUS_CHANGE",
          title,
          message: `El pedido de ${clients[0].company} espera revisión y aprobación.`,
          priority: "HIGH",
          link: `/orders/${order1.id}`,
          metadata: { orderId: order1.id, orderNumber: order1.orderNumber, newStatus: "PENDIENTE_APROBACION" },
        },
      });
    }
  }

  let destination = await prisma.shippingDestination.findFirst({ where: { name: "Rotterdam Demo" } });
  if (!destination) {
    destination = await prisma.shippingDestination.create({ data: { name: "Rotterdam Demo", city: "Rotterdam", country: "Países Bajos", portCode: "NLRTM", defaultMode: "FTL", incotermDefault: "CIF", certificateFormats: ["EUR.1", "FORM A"] } });
  } else {
    destination = await prisma.shippingDestination.update({ where: { id: destination.id }, data: { certificateFormats: ["EUR.1", "FORM A"] } });
  }
  let shipment = await prisma.shipment.findUnique({ where: { shipmentNumber: "SHP-DEMO-001" } });
  if (!shipment) {
    shipment = await prisma.shipment.create({
      data: {
        shipmentNumber: "SHP-DEMO-001", status: "BORRADOR", destinationId: destination.id,
        orders: { create: [{ orderId: order2.id }] },
      },
    });
  }

  const existingCertificates = await prisma.certificate.count({ where: { number: { in: ["CERT-DEMO-QUALITY-01", "CERT-DEMO-PHYTO-01", "CERT-DEMO-ORIGIN-01"] } } });
  if (existingCertificates === 0) {
    await prisma.certificate.createMany({
      data: [
        { type: "CALIDAD", number: "CERT-DEMO-QUALITY-01", issuer: "Laboratorio de demostración", issuedAt: new Date("2026-05-01T00:00:00Z"), expiresAt: new Date("2027-05-01T00:00:00Z"), productId: products[0].id, lotId: lots[0].id, countryOfOrigin: "Colombia" },
        { type: "FITOSANITARIO", number: "CERT-DEMO-PHYTO-01", issuer: "Autoridad de demostración", issuedAt: new Date("2026-05-12T00:00:00Z"), expiresAt: new Date("2027-05-12T00:00:00Z"), lotId: lots[1].id, shipmentId: shipment.id, countryOfOrigin: "Colombia" },
        { type: "ORIGEN", number: "CERT-DEMO-ORIGIN-01", issuer: "Entidad de demostración", documentFormat: "EUR.1", countryOfOrigin: "Colombia", issuedAt: new Date("2026-05-12T00:00:00Z"), expiresAt: new Date("2027-05-12T00:00:00Z"), productId: products[1].id, lotId: lots[1].id, shipmentId: shipment.id },
      ],
    });
  }

  console.log("Base de Sprint 2 cargada con datos sintéticos de demostración.");
  console.log(`Acceso ADMIN local: admin@ritech.local / ${password}`);
  console.log(`Pedidos demo: ${order1.orderNumber} (pendiente) y ${order2.orderNumber} (confirmado).`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
