"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CircleUserRound, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth, type UserRole } from "@/lib/auth";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  active: boolean;
  createdAt: string;
};

const availableRoles: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "GERENTE", label: "Gerente" },
  { value: "OPERADOR", label: "Operador" },
  { value: "CONTADOR", label: "Contador" },
];

export default function UsersPage() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "OPERADOR" as UserRole });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api.get<ManagedUser[]>("/users"));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el directorio de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const { role, ...userData } = form;
      await api.post("/users", { ...userData, roles: [role] });
      setForm({ name: "", email: "", password: "", role: "OPERADOR" });
      setShowForm(false);
      setSuccess("Usuario creado en estado activo.");
      await loadUsers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (target: ManagedUser) => {
    try {
      await api.put(`/users/${target.id}/toggle-active`, {});
      await loadUsers();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No se pudo cambiar el estado.");
    }
  };

  if (!user?.roles?.includes("ADMIN")) {
    return <DashboardLayout><div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Solo un administrador puede gestionar usuarios y roles.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]">Usuarios y roles</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Administra el acceso del equipo al flujo de exportación.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadUsers()} disabled={loading} className="gap-2">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />Actualizar
            </Button>
            <Button onClick={() => { setShowForm((visible) => !visible); setError(""); }} className="gap-2">
              <Plus size={16} />Registrar usuario
            </Button>
          </div>
        </div>

        {success && <div role="status" className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"><Check size={16} />{success}</div>}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <AnimatePresence initial={false}>
          {showForm && (
            <motion.section
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="overflow-hidden rounded-xl border border-border bg-card"
              aria-labelledby="new-user-title"
            >
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 id="new-user-title" className="text-base font-semibold">Nuevo acceso</h3>
                    <p className="mt-1 text-xs text-muted-foreground">La cuenta quedará activa al guardar.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="user-name">Nombre completo</Label>
                      <Input id="user-name" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-email">Correo electrónico</Label>
                      <Input id="user-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-role">Rol</Label>
                      <select id="user-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>
                        {availableRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-password">Contraseña inicial</Label>
                      <Input id="user-password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}" aria-describedby="password-help" />
                      <p id="password-help" className="text-[11px] text-muted-foreground">Mínimo 8 caracteres, una mayúscula y un número.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="submit" disabled={submitting}>{submitting ? "Guardando…" : "Guardar usuario"}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  </div>
                </form>
                <aside className="hidden border-l border-border pl-6 lg:block">
                  <ShieldCheck size={20} className="text-primary" />
                  <h4 className="mt-3 text-sm font-semibold">Acceso por función</h4>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Asigna únicamente el rol necesario para el trabajo. Las acciones de aprobación quedan reservadas a gerencia y administración.</p>
                </aside>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Directorio</h3>
            <p className="mt-1 text-xs text-muted-foreground">Usuarios del sistema y permisos asociados.</p>
          </div>
          {loading ? <p className="p-5 text-sm text-muted-foreground">Cargando usuarios…</p> : users.length === 0 ? (
            <div className="p-10 text-center">
              <CircleUserRound size={24} className="mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">No hay usuarios registrados</p>
              <p className="mt-1 text-xs text-muted-foreground">Crea el primer acceso para el equipo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ledger-table min-w-[620px] text-xs">
                <thead><tr><th>Persona</th><th>Correo</th><th>Rol</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>
                  {users.map((managedUser) => (
                    <tr key={managedUser.id}>
                      <td className="font-semibold">{managedUser.name}</td>
                      <td className="text-muted-foreground">{managedUser.email}</td>
                      <td>{managedUser.roles.map((role) => availableRoles.find((item) => item.value === role)?.label ?? role).join(", ")}</td>
                      <td><span className={`status-pill ${managedUser.active ? "state-ready" : "state-neutral"}`}>{managedUser.active ? "Activo" : "Inactivo"}</span></td>
                      <td className="text-right"><button type="button" onClick={() => void toggleActive(managedUser)} className="font-semibold text-primary hover:underline">{managedUser.active ? "Desactivar" : "Activar"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
