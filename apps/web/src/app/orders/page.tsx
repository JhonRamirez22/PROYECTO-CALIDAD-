"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { useScrollReveal, useEntranceReveal } from "@/hooks/use-gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ShoppingCart, X, CreditCard, Store, Eye } from "lucide-react";
import { api } from "@/lib/api";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  rejectReason?: string | null;
  paymentStatus: string;
  incoterm: string;
  currency: string;
  totalAmount: string | null;
  client: { company: string };
  items: { id: string; quantity: string; unitPrice: string; product: { name: string }; lot?: { traceabilityCode: string } | null }[];
  createdAt: string;
}

interface Client { id: string; company: string; }
interface Product { id: string; name: string; }
interface Lot { id: string; productId: string; traceabilityCode: string; weight: number | string; status: string; }
type OrderDraftItem = { productId: string; lotId: string; quantity: string; unitPrice: string; packageCount: string; grossWeight: string; dimensions: string; marks: string };

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};
const statusColors: Record<string, string> = {
  BORRADOR: "bg-muted text-muted-foreground border-l-muted-foreground",
  PENDIENTE_APROBACION: "bg-warning/10 text-warning border-l-warning",
  CONFIRMADO: "bg-success/10 text-success border-l-success",
  RECHAZADO: "bg-destructive/10 text-destructive border-l-destructive",
  ENVIADO: "bg-primary/10 text-primary border-l-primary",
  ENTREGADO: "bg-success/10 text-success border-l-success",
  CANCELADO: "bg-muted text-muted-foreground border-l-muted-foreground",
};
const paymentLabels: Record<string, string> = {
  PENDIENTE: "Sin pago",
  PROCESANDO: "Procesando",
  COMPLETADO: "Pagado",
  FALLIDO: "Pago fallido",
  REEMBOLSADO: "Reembolsado",
};
const paymentColors: Record<string, string> = {
  PENDIENTE: "bg-muted text-muted-foreground",
  PROCESANDO: "bg-warning/10 text-warning",
  COMPLETADO: "bg-success/10 text-success",
  FALLIDO: "bg-destructive/10 text-destructive",
  REEMBOLSADO: "bg-primary/10 text-primary",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clientId: "", incoterm: "FOB", currency: "EUR", items: [{ productId: "", lotId: "", quantity: "", unitPrice: "", packageCount: "1", grossWeight: "", dimensions: "", marks: "" } as OrderDraftItem] });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const headerRef = useEntranceReveal({ delay: 0.1 });
  const listRef = useScrollReveal({ stagger: 0.05 });

  useEffect(() => { fetchOrders(); fetchClients(); fetchProducts(); fetchLots(); }, []);

  const fetchOrders = async () => {
    try { setOrders(await api.get<Order[]>("/orders")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  const fetchClients = async () => { try { setClients(await api.get<Client[]>("/clients")); } catch (e) { /* */ } };
  const fetchProducts = async () => { try { setProducts(await api.get<Product[]>("/products")); } catch (e) { /* */ } };
  const fetchLots = async () => { try { setLots(await api.get<Lot[]>("/lots?status=DISPONIBLE")); } catch (e) { /* */ } };

  const handlePay = async (orderId: string) => {
    try {
      const data = await api.post<{ url?: string }>("/payments/create-checkout-session", { orderId });
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Payment error:", e);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: "", lotId: "", quantity: "", unitPrice: "", packageCount: "1", grossWeight: "", dimensions: "", marks: "" }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const incomplete = form.items.find((item) =>
      !item.productId || !item.lotId || Number(item.quantity) <= 0 || Number(item.unitPrice) < 0 ||
      Number(item.packageCount) < 1 || Number(item.grossWeight) < Number(item.quantity) || !item.dimensions.trim(),
    );
    if (!form.clientId || incomplete) {
      setFormError("Selecciona cliente, producto, lote y completa cantidad, embalaje y dimensiones. El peso bruto no puede ser menor que el neto.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/orders", {
        clientId: form.clientId,
        incoterm: form.incoterm,
        currency: form.currency,
        items: form.items.map((item) => ({
          productId: item.productId,
          lotId: item.lotId,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          packageCount: parseInt(item.packageCount, 10),
          grossWeight: parseFloat(item.grossWeight),
          dimensions: item.dimensions,
          marks: item.marks,
        })),
      });
      setDialogOpen(false);
      setForm({ clientId: "", incoterm: "FOB", currency: "EUR", items: [{ productId: "", lotId: "", quantity: "", unitPrice: "", packageCount: "1", grossWeight: "", dimensions: "", marks: "" }] });
      fetchOrders();
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : "No se pudo crear el pedido.");
    } finally { setSubmitting(false); }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.client.company.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getItemsTotal = (items: Order["items"]) =>
    items.reduce((sum, i) => sum + parseFloat(i.quantity) * parseFloat(i.unitPrice), 0);

  const draftTotal = form.items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    return sum + (Number.isFinite(quantity * unitPrice) ? quantity * unitPrice : 0);
  }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div ref={headerRef} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Pedidos</h1>
            <p className="text-muted-foreground">Gestión de pedidos de exportación</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.location.href = "/checkout"}>
              <Store className="h-4 w-4 mr-2" />Tienda
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Nuevo Pedido
            </Button>
          </div>
        </div>

        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto ring-1 ring-foreground/10 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Crear Pedido</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Registre un nuevo pedido de exportación</p>
              {formError && <p role="alert" className="mb-4 rounded-md bg-destructive/5 p-3 text-xs text-destructive">{formError}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Incoterm</Label>
                    <Select value={form.incoterm} onValueChange={(v) => setForm({ ...form, incoterm: v ?? "FOB" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["FOB", "CFR", "CIF", "EXW", "FCA"].map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v ?? "EUR" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["EUR", "USD", "COP"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Agregar</Button>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                      <Select value={item.productId} onValueChange={(v) => { updateItem(i, "productId", v ?? ""); updateItem(i, "lotId", ""); }}>
                        <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={item.lotId} onValueChange={(v) => updateItem(i, "lotId", v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Lote disponible" /></SelectTrigger>
                        <SelectContent>{lots.filter((lot) => lot.productId === item.productId).map((lot) => <SelectItem key={lot.id} value={lot.id}>{lot.traceabilityCode} · {Number(lot.weight).toLocaleString("es-CO")} kg</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" min="0.01" step="0.01" placeholder="Cantidad neta (kg)" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} required />
                        <Input type="number" min="0" step="0.01" placeholder="Precio unitario/kg" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} required />
                        <Input type="number" min="1" step="1" placeholder="N.º de bultos" value={item.packageCount} onChange={(e) => updateItem(i, "packageCount", e.target.value)} required />
                        <Input type="number" min="0.01" step="0.01" placeholder="Peso bruto (kg)" value={item.grossWeight} onChange={(e) => updateItem(i, "grossWeight", e.target.value)} required />
                        <Input placeholder="Dimensiones por bulto" value={item.dimensions} onChange={(e) => updateItem(i, "dimensions", e.target.value)} required />
                        <Input placeholder="Marcas del envío (opcional)" value={item.marks} onChange={(e) => updateItem(i, "marks", e.target.value)} />
                      </div>
                      {form.items.length > 1 && <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>Quitar producto</Button></div>}
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-3 text-xs"><span className="text-muted-foreground">Subtotal estimado</span><span className="font-mono font-semibold">{form.currency} {draftTotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between text-sm"><span className="font-semibold">Total</span><span className="font-mono font-bold">{form.currency} {draftTotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span></div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creando..." : "Crear Pedido"}
                </Button>
              </form>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar pedido..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando pedidos...</p>
        ) : filtered.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No se encontraron pedidos</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Cree un nuevo pedido o ajuste los filtros</p>
            </CardContent>
          </Card>
        ) : (
          <div ref={listRef} className="space-y-3">
            {filtered.map((order) => {
              const total = getItemsTotal(order.items);
              return (
                <Card
                  key={order.id}
                  className="shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border-l-2 ${
                                statusColors[order.status] || ""
                              }`}
                            >
                              {order.status === "BORRADOR" && order.rejectReason ? "Devuelto a borrador" : statusLabels[order.status]}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{order.client.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-semibold">{order.currency} {total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">{order.items.length} items · {order.incoterm}</p>
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentColors[order.paymentStatus] || paymentColors.PENDIENTE}`}>
                            {paymentLabels[order.paymentStatus] || "Sin pago"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Detalle
                          </Button>
                          {(order.status === "CONFIRMADO" || order.status === "PENDIENTE_APROBACION") && order.paymentStatus !== "COMPLETADO" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePay(order.id)}
                              className="text-xs"
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
