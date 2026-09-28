"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package2,
  ShieldCheck,
  Users,
  Warehouse,
  Wheat,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type UserRole } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operación",
    items: [
      { label: "Manifiesto", href: "/", icon: LayoutDashboard },
      { label: "Pedidos", href: "/orders", icon: ClipboardList },
      { label: "Clientes", href: "/clients", icon: Users },
    ],
  },
  {
    label: "Origen y lote",
    items: [
      { label: "Productos", href: "/products", icon: Package2 },
      { label: "Lotes", href: "/lots", icon: Boxes },
      { label: "Inventario", href: "/inventory", icon: Warehouse },
    ],
  },
  {
    label: "Documentación",
    items: [
      { label: "Certificados", href: "/certificates", icon: BadgeCheck },
      { label: "Documentos", href: "/documents", icon: FileText },
    ],
  },
];

const roleNames: Record<UserRole, string> = {
  ADMIN: "Administración",
  GERENTE: "Gerencia",
  OPERADOR: "Operación",
  CONTADOR: "Contabilidad",
  PROPIETARIO: "Productor",
  COMPRADOR: "Comprador",
  VENDEDOR: "Vendedor",
  LOGISTICA: "Logística",
  CLIENTE_PERSONAL: "Cliente",
};

export function Sidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || item.roles.some((role) => user?.roles?.includes(role)),
    ),
  }));

  return (
    <aside
      aria-label="Navegación principal"
      className={cn(
        "workspace-sidebar fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-[82px] items-center justify-between border-b border-white/10 px-6">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <span className="brand-mark" aria-hidden="true"><Wheat size={19} strokeWidth={1.7} /></span>
          <span>
            <span className="block text-[15px] font-bold tracking-[-0.03em] text-white">RiTech</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Export desk</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onNavigate}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 pt-5">
        <div className="workspace-switcher">
          <span className="workspace-switcher-dot" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-white">RiTech Colombia</span>
            <span className="mt-0.5 block text-[10px] text-slate-300">Exportación · UE</span>
          </span>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {visibleGroups.map((group) => (
          <section key={group.label} className="mb-6">
            <h2 className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn("workspace-nav-link", active && "workspace-nav-link-active")}
                  >
                    <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {user?.roles?.includes("ADMIN") && (
          <section className="mb-6">
            <h2 className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Administración</h2>
            <Link
              href="/users"
              onClick={onNavigate}
              aria-current={pathname.startsWith("/users") ? "page" : undefined}
              className={cn("workspace-nav-link", pathname.startsWith("/users") && "workspace-nav-link-active")}
            >
              <ShieldCheck aria-hidden="true" size={17} strokeWidth={1.8} />
              <span>Usuarios y roles</span>
            </Link>
          </section>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-xs font-medium text-white">{user?.email ?? "Sesión operativa"}</p>
        <p className="mt-1 text-[10px] text-slate-300">
          {user?.roles?.map((role) => roleNames[role] ?? role).join(" · ") || "Exportaciones"}
        </p>
      </div>
    </aside>
  );
}
