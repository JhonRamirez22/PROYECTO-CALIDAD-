"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const pageNames: Record<string, string> = {
  "/": "Manifiesto",
  "/products": "Productos",
  "/lots": "Lotes",
  "/inventory": "Inventario",
  "/clients": "Clientes",
  "/orders": "Pedidos",
  "/certificates": "Certificados",
  "/documents": "Documentos",
  "/users": "Usuarios y roles",
};

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const currentPage = Object.entries(pageNames)
    .sort(([left], [right]) => right.length - left.length)
    .find(([path]) => path === "/" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`))?.[1] ?? "Export Desk";
  const initials = user?.email?.slice(0, 1).toUpperCase() ?? "R";

  return (
    <header className="workspace-topbar">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Abrir navegación"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu size={19} />
        </Button>
        <div className="min-w-0">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">RiTech / Operación</p>
          <h1 className="truncate text-sm font-semibold text-foreground sm:mt-0.5">{currentPage}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/notifications"
          aria-label="Ver notificaciones"
          className="topbar-icon-link"
        >
          <Bell size={18} strokeWidth={1.8} />
        </Link>
        <div className="hidden h-8 w-px bg-border sm:block" />
        <div className="hidden items-center gap-2 sm:flex">
          <span className="user-avatar" aria-hidden="true">{initials}</span>
          <span className="max-w-[170px] truncate text-xs font-medium text-foreground">{user?.email ?? "Usuario"}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut size={17} />
        </Button>
      </div>
    </header>
  );
}
