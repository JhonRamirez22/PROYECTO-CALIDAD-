import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_PERMISSIONS: Array<{
  role: string;
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}> = [
  // ADMIN — full access to everything
  { role: "ADMIN", module: "products", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "lots", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "clients", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "orders", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "payments", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "certificates", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "farm-certificates", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "quality", canCreate: true, canRead: true, canUpdate: false, canDelete: true },
  { role: "ADMIN", module: "quality-sample", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "documents", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "ADMIN", module: "users", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "permissions", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "ADMIN", module: "audit", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "ADMIN", module: "seller-profiles", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "logistics", canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  { role: "ADMIN", module: "commissions", canCreate: true, canRead: true, canUpdate: true, canDelete: true },

  // PROPIETARIO — farm owner, manages own lots + farm certs + quality samples
  { role: "PROPIETARIO", module: "products", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "PROPIETARIO", module: "lots", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "PROPIETARIO", module: "clients", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "orders", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "payments", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "certificates", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "PROPIETARIO", module: "farm-certificates", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "PROPIETARIO", module: "quality", canCreate: true, canRead: true, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "quality-sample", canCreate: true, canRead: true, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "documents", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "PROPIETARIO", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "seller-profiles", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "logistics", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "PROPIETARIO", module: "commissions", canCreate: false, canRead: false, canUpdate: false, canDelete: false },

  // COMPRADOR — buyer client with login, reads own orders + invoices
  { role: "COMPRADOR", module: "products", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "lots", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "clients", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "orders", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "payments", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "certificates", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "farm-certificates", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "quality", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "quality-sample", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "documents", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "logistics", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "COMPRADOR", module: "commissions", canCreate: false, canRead: false, canUpdate: false, canDelete: false },

  // VENDEDOR — seller with commission, manages own products + orders
  { role: "VENDEDOR", module: "products", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "VENDEDOR", module: "lots", canCreate: true, canRead: true, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "clients", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "orders", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "VENDEDOR", module: "payments", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "certificates", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "VENDEDOR", module: "farm-certificates", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "quality", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "quality-sample", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "documents", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "VENDEDOR", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "seller-profiles", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "VENDEDOR", module: "logistics", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "VENDEDOR", module: "commissions", canCreate: false, canRead: true, canUpdate: false, canDelete: false },

  // LOGISTICA — transport, manages logistics entries + reads orders
  { role: "LOGISTICA", module: "products", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "lots", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "clients", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "orders", canCreate: false, canRead: true, canUpdate: true, canDelete: false },
  { role: "LOGISTICA", module: "payments", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "certificates", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "farm-certificates", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "quality", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "quality-sample", canCreate: false, canRead: true, canUpdate: true, canDelete: false },
  { role: "LOGISTICA", module: "documents", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "LOGISTICA", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "LOGISTICA", module: "logistics", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "LOGISTICA", module: "commissions", canCreate: false, canRead: false, canUpdate: false, canDelete: false },

  // CLIENTE_PERSONAL — cliente interno RiTech, solo lectura de sus datos
  { role: "CLIENTE_PERSONAL", module: "products", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "lots", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "clients", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "orders", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "payments", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "certificates", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "farm-certificates", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "quality", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "quality-sample", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "documents", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "logistics", canCreate: false, canRead: false, canUpdate: false, canDelete: false },
  { role: "CLIENTE_PERSONAL", module: "commissions", canCreate: false, canRead: false, canUpdate: false, canDelete: false },

  // Roles used by the Sprint 2 stories.
  { role: "GERENTE", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "GERENTE", module: "products", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "GERENTE", module: "lots", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "GERENTE", module: "clients", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "GERENTE", module: "orders", canCreate: false, canRead: true, canUpdate: true, canDelete: false },
  { role: "GERENTE", module: "certificates", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "GERENTE", module: "documents", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "OPERADOR", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "OPERADOR", module: "products", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "OPERADOR", module: "lots", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "OPERADOR", module: "clients", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "OPERADOR", module: "orders", canCreate: true, canRead: true, canUpdate: false, canDelete: false },
  { role: "OPERADOR", module: "certificates", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "OPERADOR", module: "documents", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
  { role: "CONTADOR", module: "dashboard", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CONTADOR", module: "clients", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CONTADOR", module: "orders", canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  { role: "CONTADOR", module: "certificates", canCreate: true, canRead: true, canUpdate: false, canDelete: false },
  { role: "CONTADOR", module: "documents", canCreate: true, canRead: true, canUpdate: true, canDelete: false },
];

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    for (const perm of DEFAULT_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: {
          role_module: { role: perm.role as any, module: perm.module },
        },
        update: {
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
        },
        create: {
          role: perm.role as any,
          module: perm.module,
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
        },
      });
    }
  }

  async findAll() {
    return this.prisma.permission.findMany({ orderBy: [{ role: "asc" }, { module: "asc" }] });
  }

  async findByRole(role: string) {
    return this.prisma.permission.findMany({
      where: { role: role as any },
      orderBy: { module: "asc" },
    });
  }

  async checkPermission(role: string, module: string, action: "create" | "read" | "update" | "delete") {
    const perm = await this.prisma.permission.findUnique({
      where: { role_module: { role: role as any, module } },
    });

    if (!perm) return false;

    switch (action) {
      case "create": return perm.canCreate;
      case "read": return perm.canRead;
      case "update": return perm.canUpdate;
      case "delete": return perm.canDelete;
      default: return false;
    }
  }

  async updatePermission(role: string, module: string, data: {
    canCreate?: boolean;
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  }) {
    return this.prisma.permission.upsert({
      where: { role_module: { role: role as any, module } },
      update: data,
      create: {
        role: role as any,
        module,
        canCreate: data.canCreate ?? false,
        canRead: data.canRead ?? true,
        canUpdate: data.canUpdate ?? false,
        canDelete: data.canDelete ?? false,
      },
    });
  }

  async getMatrix() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ role: "asc" }, { module: "asc" }],
    });

    const matrix: Record<string, Record<string, typeof permissions[0]>> = {};
    for (const perm of permissions) {
      if (!matrix[perm.role]) matrix[perm.role] = {};
      matrix[perm.role][perm.module] = perm;
    }

    return matrix;
  }
}
