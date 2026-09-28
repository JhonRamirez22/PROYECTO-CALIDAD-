"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Truck, Package } from "lucide-react";
import { api } from "@/lib/api";

interface LogisticsEntry {
  id: string;
  orderId: string;
  order?: { orderNumber: string };
  provider: string;
  shipmentType: string;
  trackingNumber: string | null;
  originPort: string | null;
  destinationPort: string | null;
  estimatedDeparture: string | null;
  estimatedArrival: string | null;
  actualDeparture: string | null;
  actualArrival: string | null;
  status: string;
  notes: string | null;
}

interface Order { id: string; orderNumber: string; }

const statusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_TRANSITO: "En Tránsito",
  ENTREGADO: "Entregado",
  RETRASADO: "Retrasado",
};

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-muted text-muted-foreground",
  EN_TRANSITO: "bg-primary/10 text-primary",
  ENTREGADO: "bg-success/10 text-success",
  RETRASADO: "bg-destructive/10 text-destructive",
};

export default function LogisticsPage() {
  const [entries, setEntries] = useState<LogisticsEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    orderId: "",
    provider: "",
    shipmentType: "MARITIMO",
    trackingNumber: "",
    originPort: "",
    destinationPort: "",
    estimatedDeparture: "",
    estimatedArrival: "",
    notes: "",
  });

  useEffect(() => { fetchEntries(); fetchOrders(); }, []);

  const fetchEntries = async () => {
    try { setEntries(await api.get<LogisticsEntry[]>("/logistics")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    try { setOrders(await api.get<Order[]>("/orders")); }
    catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/logistics", {
        ...form,
        trackingNumber: form.trackingNumber || undefined,
        originPort: form.originPort || undefined,
        destinationPort: form.destinationPort || undefined,
        estimatedDeparture: form.estimatedDeparture || undefined,
        estimatedArrival: form.estimatedArrival || undefined,
      });
      setDialogOpen(false);
      setForm({ orderId: "", provider: "", shipmentType: "MARITIMO", trackingNumber: "", originPort: "", destinationPort: "", estimatedDeparture: "", estimatedArrival: "", notes: "" });
      fetchEntries();
    } finally { setSubmitting(false); }
  };

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = e.provider.toLowerCase().includes(q) ||
      (e.order?.orderNumber ?? "").toLowerCase().includes(q) ||
      (e.trackingNumber ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Logística</h1>
            <p className="text-muted-foreground">Gestión de envíos y transporte</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nuevo Envío
          </Button>
        </div>

        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto ring-1 ring-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Registrar Envío</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pedido *</Label>
                  <Select value={form.orderId} onValueChange={(v) => setForm({ ...form, orderId: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar pedido" /></SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => <SelectItem key={o.id} value={o.id}>{o.orderNumber}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proveedor de logística *</Label>
                  <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="DHL, Maersk..." required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de envío *</Label>
                  <Select value={form.shipmentType} onValueChange={(v) => setForm({ ...form, shipmentType: v ?? "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARITIMO">Marítimo</SelectItem>
                      <SelectItem value="AEREO">Aéreo</SelectItem>
                      <SelectItem value="TERRESTRE">Terrestre</SelectItem>
                      <SelectItem value="MIXTO">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de tracking</Label>
                  <Input value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} placeholder="Tracking ID" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Puerto origen</Label>
                    <Input value={form.originPort} onChange={(e) => setForm({ ...form, originPort: e.target.value })} placeholder="Buenaventura" />
                  </div>
                  <div className="space-y-2">
                    <Label>Puerto destino</Label>
                    <Input value={form.destinationPort} onChange={(e) => setForm({ ...form, destinationPort: e.target.value })} placeholder="Hamburgo" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Salida estimada</Label>
                    <Input type="datetime-local" value={form.estimatedDeparture} onChange={(e) => setForm({ ...form, estimatedDeparture: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Llegada estimada</Label>
                    <Input type="datetime-local" value={form.estimatedArrival} onChange={(e) => setForm({ ...form, estimatedArrival: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
            <Input className="pl-9" placeholder="Buscar envío..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando envíos...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron envíos</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm font-medium">{entry.order?.orderNumber}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[entry.status] ?? "bg-muted text-muted-foreground"}`}>
                      {statusLabels[entry.status] ?? entry.status}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold">{entry.provider}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{entry.shipmentType}</p>
                  {entry.trackingNumber && (
                    <p className="text-xs text-muted-foreground mt-2 font-mono">Track: {entry.trackingNumber}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    {entry.originPort && <span>Origen: {entry.originPort}</span>}
                    {entry.destinationPort && <span>Destino: {entry.destinationPort}</span>}
                  </div>
                  {entry.estimatedArrival && (
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      Llegada est: {new Date(entry.estimatedArrival).toLocaleDateString("es-CO")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
