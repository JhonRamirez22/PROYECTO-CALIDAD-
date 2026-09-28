"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, X, Banknote } from "lucide-react";
import { api } from "@/lib/api";

interface Commission {
  id: string;
  sellerId: string;
  orderId: string;
  order?: { orderNumber: string; totalAmount: number; currency: string };
  rate: number;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface User { id: string; name: string; email: string; }

const statusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PAGADA: "Pagada",
  CANCELADA: "Cancelada",
};

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-warning/10 text-warning",
  PAGADA: "bg-success/10 text-success",
  CANCELADA: "bg-destructive/10 text-destructive",
};

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    sellerId: "",
    orderId: "",
    rate: "0.01",
    currency: "USD",
  });

  useEffect(() => { fetchCommissions(); fetchUsers(); }, []);

  const fetchCommissions = async () => {
    try { setCommissions(await api.get<Commission[]>("/commissions")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try { setUsers(await api.get<User[]>("/users?role=VENDEDOR")); }
    catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/commissions", form);
      setDialogOpen(false);
      setForm({ sellerId: "", orderId: "", rate: "0.01", currency: "USD" });
      fetchCommissions();
    } finally { setSubmitting(false); }
  };

  const handlePay = async (id: string) => {
    try {
      await api.post(`/commissions/${id}/pay`, {});
      fetchCommissions();
    } catch (e) { console.error(e); }
  };

  const filtered = commissions.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = (c.order?.orderNumber ?? "").toLowerCase().includes(q) ||
      c.sellerId.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPending = commissions.filter((c) => c.status === "PENDIENTE").reduce((acc, c) => acc + c.amount, 0);
  const totalPaid = commissions.filter((c) => c.status === "PAGADA").reduce((acc, c) => acc + c.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Comisiones</h1>
            <p className="text-muted-foreground">Gestión de comisiones de vendedores</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Registrar Comisión
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total pendiente</p>
              <p className="text-2xl font-bold text-warning">${totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total pagado</p>
              <p className="text-2xl font-bold text-success">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total comisiones</p>
              <p className="text-2xl font-bold">${(totalPending + totalPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        </div>

        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-sm ring-1 ring-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Registrar Comisión</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Vendedor *</Label>
                  <select value={form.sellerId} onChange={(e) => setForm({ ...form, sellerId: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" required>
                    <option value="">Seleccionar vendedor</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Orden ID *</Label>
                  <Input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} placeholder="ID de la orden" required />
                </div>
                <div className="space-y-2">
                  <Label>Tasa de comisión</Label>
                  <Input type="number" step="0.001" min="0" max="1" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="COP">COP</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Registrando..." : "Registrar"}
                </Button>
              </form>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar comisión..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="all">Todos</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando comisiones...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron comisiones</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                      <Banknote className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{c.order?.orderNumber}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[c.status] ?? "bg-muted text-muted-foreground"}`}>
                          {statusLabels[c.status] ?? c.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vendedor: {c.sellerId} · Tasa: {(c.rate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">${c.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">{c.currency}</p>
                  </div>
                  <div className="shrink-0">
                    {c.status === "PENDIENTE" ? (
                      <Button size="sm" onClick={() => handlePay(c.id)}>Pagar</Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {c.paidAt ? new Date(c.paidAt).toLocaleDateString("es-CO") : ""}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
