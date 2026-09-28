"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/role-guard";

const MODULES = [
  "products",
  "lots",
  "clients",
  "orders",
  "payments",
  "certificates",
  "farm-certificates",
  "quality",
  "quality-sample",
  "documents",
  "dashboard",
  "users",
  "permissions",
  "audit",
  "seller-profiles",
  "logistics",
  "commissions",
];

const ROLES = ["ADMIN", "PROPIETARIO", "COMPRADOR", "VENDEDOR", "LOGISTICA"];

type PermissionMatrix = Record<string, Record<string, {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}>>;

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      setMatrix(await api.get<PermissionMatrix>("/permissions/matrix"));
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (role: string, module: string, field: "canCreate" | "canRead" | "canUpdate" | "canDelete") => {
    const current = matrix[role]?.[module];
    if (!current) return;

    const newValue = !current[field];

    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: { ...current, [field]: newValue },
      },
    }));

    setSaving(true);
    try {
      await api.put(`/permissions/${role}/${module}`, { ...current, [field]: newValue });
    } catch {
      setMatrix((prev) => ({
        ...prev,
        [role]: {
          ...prev[role],
          [module]: { ...current, [field]: !newValue },
        },
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RoleGuard
        roles={["ADMIN"]}
        fallback={
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <h2 className="text-xl font-heading font-bold">Acceso denegado</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              No tienes permisos para gestionar la matriz de permisos. Contacta al administrador.
            </p>
          </div>
        }
      >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Permisos por Rol</h1>
            <p className="text-sm text-muted-foreground">
              Configura los permisos de acceso por módulo y rol
            </p>
          </div>
          {saving && (
            <Badge variant="outline" className="animate-pulse">
              Guardando...
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Módulo</th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    className="px-4 py-3 text-center font-medium"
                    colSpan={4}
                  >
                    {role}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-border bg-muted/30">
                <th />
                {ROLES.map((role) => (
                  <th key={role} className="px-2 py-2 text-center text-xs text-muted-foreground" colSpan={4}>
                    <div className="flex justify-center gap-1">
                      <span className="w-8 text-center">C</span>
                      <span className="w-8 text-center">R</span>
                      <span className="w-8 text-center">U</span>
                      <span className="w-8 text-center">D</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((module) => (
                <tr key={module} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium capitalize">{module}</td>
                  {ROLES.map((role) => {
                    const perm = matrix[role]?.[module];
                    if (!perm) {
                      return (
                        <td key={role} className="px-2 py-3 text-center text-muted-foreground" colSpan={4}>
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={role} className="px-2 py-3">
                        <div className="flex justify-center gap-1">
                          {(["canCreate", "canRead", "canUpdate", "canDelete"] as const).map((field) => (
                            <button
                              key={field}
                              onClick={() => togglePermission(role, module, field)}
                              className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                                perm[field]
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                              title={`${field.replace("can", "")} — ${perm[field] ? "Activo" : "Inactivo"}`}
                            >
                              {field.replace("can", "")[0]}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          C = Create, R = Read, U = Update, D = Delete. Los cambios se guardan automáticamente.
        </p>
      </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
