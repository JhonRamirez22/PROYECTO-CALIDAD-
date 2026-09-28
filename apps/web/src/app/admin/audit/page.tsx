"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/role-guard";

interface AuditEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  module: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-success/10 text-success",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-accent/10 text-accent",
  APPROVE: "bg-success/10 text-success",
  REJECT: "bg-destructive/10 text-destructive",
  PAYMENT: "bg-accent/10 text-accent",
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    module: "",
    action: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchEntries();
  }, [page, filters]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (filters.module) params.set("module", filters.module);
      if (filters.action) params.set("action", filters.action);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const data = await api.get<{ data: AuditEntry[]; meta: { totalPages: number } }>(`/audit?${params}`);
      setEntries(data.data);
      setTotal(data.meta.totalPages);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Fecha", "Usuario", "Acción", "Módulo", "Entidad", "IP"];
    const rows = entries.map((e) => [
      new Date(e.createdAt).toLocaleString("es-CO"),
      e.userName || "—",
      e.action,
      e.module,
      e.entityId || "—",
      e.ipAddress || "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <RoleGuard
        roles={["ADMIN"]}
        fallback={
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <h2 className="text-xl font-heading font-bold">Acceso denegado</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              No tienes permisos para ver el registro de auditoría. Contacta al administrador.
            </p>
          </div>
        }
      >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Registro de acciones realizadas en el sistema
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filters.module}
            onChange={(e) => { setFilters((f) => ({ ...f, module: e.target.value })); setPage(1); }}
          >
            <option value="">Todos los módulos</option>
            <option value="products">Productos</option>
            <option value="lots">Lotes</option>
            <option value="clients">Clientes</option>
            <option value="orders">Pedidos</option>
            <option value="payments">Pagos</option>
            <option value="auth">Auth</option>
          </select>

          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filters.action}
            onChange={(e) => { setFilters((f) => ({ ...f, action: e.target.value })); setPage(1); }}
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">Crear</option>
            <option value="UPDATE">Actualizar</option>
            <option value="DELETE">Eliminar</option>
            <option value="LOGIN">Login</option>
            <option value="APPROVE">Aprobar</option>
            <option value="REJECT">Rechazar</option>
          </select>

          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filters.startDate}
            onChange={(e) => { setFilters((f) => ({ ...f, startDate: e.target.value })); setPage(1); }}
          />
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filters.endDate}
            onChange={(e) => { setFilters((f) => ({ ...f, endDate: e.target.value })); setPage(1); }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Acción</th>
                <th className="px-4 py-3 text-left font-medium">Módulo</th>
                <th className="px-4 py-3 text-left font-medium">Entidad</th>
                <th className="px-4 py-3 text-left font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hay registros
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">{entry.userName || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={ACTION_COLORS[entry.action] || "bg-muted text-muted-foreground"}>
                        {entry.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 capitalize">{entry.module}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.entityId?.slice(0, 8) || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.ipAddress || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {total}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
