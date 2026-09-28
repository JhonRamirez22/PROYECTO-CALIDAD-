import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// New 5-role permissions matrix
type PermissionFlags = { create: boolean; read: boolean; update: boolean; delete: boolean };
const PERMISSIONS: Record<string, Partial<Record<UserRole, PermissionFlags>>> = {
  // ─── Module: products ───
  products: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: true,  read: true,  update: true,  delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: true,  read: true,  update: true,  delete: false },
    LOGISTICA:   { create: false, read: true,  update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: true,  update: false, delete: false },
  },
  // ─── Module: lots ───
  lots: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: true,  read: true,  update: true,  delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: true,  read: true,  update: false, delete: false },
    LOGISTICA:   { create: false, read: true,  update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: clients ───
  clients: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: false, read: false, update: false, delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: false, read: false, update: false, delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: orders ───
  orders: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: false, read: true,  update: false, delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: true,  read: true,  update: true,  delete: false },
    LOGISTICA:   { create: false, read: true,  update: true,  delete: false },
    CLIENTE_PERSONAL: { create: false, read: true,  update: false, delete: false },
  },
  // ─── Module: payments ───
  payments: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: false, read: true,  update: false, delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: false, read: true,  update: false, delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: true,  update: false, delete: false },
  },
  // ─── Module: quality ───
  quality: {
    ADMIN:       { create: true,  read: true,  update: false, delete: true  },
    PROPIETARIO: { create: true,  read: true,  update: false, delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: false, read: true,  update: false, delete: false },
    LOGISTICA:   { create: false, read: true,  update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: certificates ───
  certificates: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: true,  read: true,  update: true,  delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: true,  read: true,  update: true,  delete: false },
    LOGISTICA:   { create: false, read: true,  update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: true,  update: false, delete: false },
  },
  // ─── Module: farm-certificates ───
  'farm-certificates': {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: true,  read: true,  update: true,  delete: false },
    COMPRADOR:   { create: false, read: false, update: false, delete: false },
    VENDEDOR:    { create: false, read: false, update: false, delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: seller-profiles ───
  'seller-profiles': {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: false, read: false, update: false, delete: false },
    COMPRADOR:   { create: false, read: false, update: false, delete: false },
    VENDEDOR:    { create: true,  read: true,  update: true,  delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: logistics ───
  logistics: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: false, read: true,  update: false, delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: false, read: true,  update: false, delete: false },
    LOGISTICA:   { create: true,  read: true,  update: true,  delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: commissions ───
  commissions: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: false, read: false, update: false, delete: false },
    COMPRADOR:   { create: false, read: false, update: false, delete: false },
    VENDEDOR:    { create: false, read: true,  update: false, delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: documents ───
  documents: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: true,  read: true,  update: true,  delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: true,  read: true,  update: true,  delete: false },
    LOGISTICA:   { create: true,  read: true,  update: true,  delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: dashboard ───
  dashboard: {
    ADMIN:       { create: false, read: true,  update: false, delete: false },
    PROPIETARIO: { create: false, read: true,  update: false, delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: false, read: true,  update: false, delete: false },
    LOGISTICA:   { create: false, read: true,  update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: true,  update: false, delete: false },
  },
  // ─── Module: users ───
  users: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: false, read: false, update: false, delete: false },
    COMPRADOR:   { create: false, read: false, update: false, delete: false },
    VENDEDOR:    { create: false, read: false, update: false, delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: permissions ───
  permissions: {
    ADMIN:       { create: true,  read: true,  update: true,  delete: false },
    PROPIETARIO: { create: false, read: false, update: false, delete: false },
    COMPRADOR:   { create: false, read: false, update: false, delete: false },
    VENDEDOR:    { create: false, read: false, update: false, delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: audit ───
  audit: {
    ADMIN:       { create: false, read: true,  update: false, delete: false },
    PROPIETARIO: { create: false, read: false, update: false, delete: false },
    COMPRADOR:   { create: false, read: false, update: false, delete: false },
    VENDEDOR:    { create: false, read: false, update: false, delete: false },
    LOGISTICA:   { create: false, read: false, update: false, delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
  // ─── Module: quality-sample ───
  'quality-sample': {
    ADMIN:       { create: true,  read: true,  update: true,  delete: true  },
    PROPIETARIO: { create: true,  read: true,  update: false, delete: false },
    COMPRADOR:   { create: false, read: true,  update: false, delete: false },
    VENDEDOR:    { create: false, read: true,  update: false, delete: false },
    LOGISTICA:   { create: false, read: true,  update: true,  delete: false },
    CLIENTE_PERSONAL: { create: false, read: false, update: false, delete: false },
  },
};

const roles: UserRole[] = ['ADMIN', 'PROPIETARIO', 'COMPRADOR', 'VENDEDOR', 'LOGISTICA', 'CLIENTE_PERSONAL'];

const seedPassword = process.env.RITECH_DEMO_PASSWORD || randomBytes(24).toString('base64url');
const users = [
  { email: 'admin@ritech.com',       name: 'Administrador',   roles: ['ADMIN'] as UserRole[] },
  { email: 'propietario@ritech.com', name: 'Propietario',     roles: ['PROPIETARIO'] as UserRole[] },
  { email: 'comprador@ritech.com',   name: 'Comprador EU',    roles: ['COMPRADOR'] as UserRole[] },
  { email: 'vendedor@ritech.com',    name: 'Vendedor',        roles: ['VENDEDOR'] as UserRole[] },
  { email: 'logistica@ritech.com',   name: 'Logística',       roles: ['LOGISTICA'] as UserRole[] },
  { email: 'cliente@ritech.com',     name: 'Cliente RiTech',  roles: ['CLIENTE_PERSONAL'] as UserRole[] },
];

async function main() {
  console.log('Seeding database...');

  // Seed users with roles array
  for (const u of users) {
    const hashed = await bcrypt.hash(seedPassword, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roles: u.roles as UserRole[], password: hashed, active: true },
      create: { email: u.email, name: u.name, password: hashed, roles: u.roles as UserRole[] },
    });
    console.log(`Created user: ${u.email} (${u.roles.join(', ')})`);
  }
  if (!process.env.RITECH_DEMO_PASSWORD) {
    console.log(`Synthetic seed password for all seeded accounts: ${seedPassword}`);
  }

  // Seed permissions for all roles × modules
  for (const [module, rolesPerms] of Object.entries(PERMISSIONS)) {
    for (const role of roles) {
      const p = rolesPerms[role];
      if (!p) continue;
      await prisma.permission.upsert({
        where: { role_module: { role, module } },
        update: { canCreate: p.create, canRead: p.read, canUpdate: p.update, canDelete: p.delete },
        create: { role, module, canCreate: p.create, canRead: p.read, canUpdate: p.update, canDelete: p.delete },
      });
    }
  }
  console.log('Seeded permissions for all roles × modules');

  // Get users for foreign keys
  const propietario = await prisma.user.findUnique({ where: { email: 'propietario@ritech.com' } });
  const vendedor = await prisma.user.findUnique({ where: { email: 'vendedor@ritech.com' } });

  // Create seller profile for vendedor
  if (vendedor) {
    await prisma.sellerProfile.upsert({
      where: { userId: vendedor.id },
      update: {},
      create: {
        userId: vendedor.id,
        farmName: 'Finca San José',
        farmLocation: 'Tumaco, Nariño',
        productionCapacity: 500,
        coffeeType: 'Café Especial',
        coffeeVariety: 'Arábica',
        qualityGrade: 'Especial',
        deforestationStatus: 'CERTIFICADO_LIBRE',
        bankAccount: '001234567890',
        bankName: 'Banco de Bogotá',
      },
    });
    console.log('Created seller profile for vendedor');
  }

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        name: 'Café Especial Huila',
        type: 'CAFE',
        variety: 'Arábica',
        origin: 'Huila, Colombia',
        altitude: '1,800 msnm',
        process: 'Lavado',
        description: 'Café de origen único de las montañas de Huila',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        name: 'Cacao Fino Nariño',
        type: 'CACAO',
        variety: 'Criollo',
        origin: 'Nariño, Colombia',
        altitude: '1,200 msnm',
        process: 'Fermentado y secado al sol',
        description: 'Cacao fino de aroma para chocolate artesanal — solo origen Nariño',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        name: 'Café Orgánico Nariño',
        type: 'CAFE',
        variety: 'Bourbon',
        origin: 'Nariño, Colombia',
        altitude: '2,000 msnm',
        process: 'Natural',
        description: 'Café orgánico certificado de alturas',
      },
    }),
  ]);
  console.log('Created products:', products.length);

  // Create lots (min 100kg for coffee)
  const lots = await Promise.all([
    prisma.lot.upsert({
      where: { traceabilityCode: 'LT-2026-0001' },
      update: {},
      create: {
        traceabilityCode: 'LT-2026-0001',
        weight: 150,
        status: 'DISPONIBLE',
        productId: 'product-1',
        ownedById: propietario?.id,
        originLocation: 'Finca El Paraíso, Huila',
        harvestDate: new Date('2026-03-15'),
        exportPrice: 8.5,
        currency: 'EUR',
        notes: 'Lote premium de alta montaña — mínimo 100kg cumplido',
      },
    }),
    prisma.lot.upsert({
      where: { traceabilityCode: 'LT-2026-0002' },
      update: {},
      create: {
        traceabilityCode: 'LT-2026-0002',
        weight: 200,
        status: 'DISPONIBLE',
        productId: 'product-2',
        ownedById: propietario?.id,
        originLocation: 'Finca San José, Tumaco, Nariño',
        harvestDate: new Date('2026-04-01'),
        exportPrice: 12.0,
        currency: 'EUR',
        notes: 'Cacao fino fermentación controlada — solo Nariño',
      },
    }),
  ]);
  console.log('Created lots:', lots.length);

  // Create clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { vatId: 'DE123456789' },
      update: {},
      create: {
        company: 'Hamburg Kaffee GmbH',
        country: 'Alemania',
        vatId: 'DE123456789',
        address: 'Kaffeestraße 12, 20095 Hamburg',
        email: 'info@hamburgkaffee.de',
        phone: '+49 40 1234567',
        status: 'ACTIVO',
        contacts: {
          create: [
            { name: 'Hans Mueller', email: 'hans@hamburgkaffee.de', isPrimary: true },
            { name: 'Anna Schmidt', email: 'anna@hamburgkaffee.de' },
          ],
        },
      },
    }),
    prisma.client.upsert({
      where: { vatId: 'NL123456789B01' },
      update: {},
      create: {
        company: 'Amsterdam Trading BV',
        country: 'Países Bajos',
        vatId: 'NL123456789B01',
        address: 'Koffieweg 45, 1012 AB Amsterdam',
        email: 'orders@amsterdamtrading.nl',
        phone: '+31 20 9876543',
        status: 'ACTIVO',
        contacts: {
          create: [
            { name: 'Jan de Vries', email: 'jan@amsterdamtrading.nl', isPrimary: true },
          ],
        },
      },
    }),
  ]);
  console.log('Created clients:', clients.length);

  // Create orders
  const orders = await Promise.all([
    prisma.order.upsert({
      where: { orderNumber: 'REQ-2026-0001' },
      update: {},
      create: {
        orderNumber: 'REQ-2026-0001',
        status: 'PENDIENTE_APROBACION',
        clientId: clients[0].id,
        sellerId: vendedor?.id,
        incoterm: 'FOB',
        currency: 'EUR',
        items: {
          create: [
            { productId: 'product-1', lotId: lots[0].id, quantity: 150, unitPrice: 8.5 },
          ],
        },
      },
    }),
    prisma.order.upsert({
      where: { orderNumber: 'REQ-2026-0002' },
      update: {},
      create: {
        orderNumber: 'REQ-2026-0002',
        status: 'CONFIRMADO',
        clientId: clients[1].id,
        sellerId: vendedor?.id,
        incoterm: 'CIF',
        currency: 'EUR',
        items: {
          create: [
            { productId: 'product-2', lotId: lots[1].id, quantity: 200, unitPrice: 12.0 },
          ],
        },
      },
    }),
  ]);
  console.log('Created orders:', orders.length);

  // Create commission for confirmed order
  if (vendedor && orders[1]) {
    const orderTotal = orders[1].totalAmount ?? 0;
    const commissionAmount = Number(orderTotal) * 0.01; // 1% default
    await prisma.commission.create({
      data: {
        orderId: orders[1].id,
        sellerId: vendedor.id,
        amount: commissionAmount,
        percentage: 1.0,
        status: 'PENDIENTE',
      },
    });
    console.log('Created commission for order REQ-2026-0002');
  }

  // Create logistics entry for confirmed order
  if (orders[1]) {
    await prisma.logisticsEntry.create({
      data: {
        orderId: orders[1].id,
        status: 'REGISTRADO',
        originPort: 'Buenaventura',
        destPort: 'Rotterdam',
        notes: 'Pedido listo para coordinar transporte',
      },
    });
    console.log('Created logistics entry for order REQ-2026-0002');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
