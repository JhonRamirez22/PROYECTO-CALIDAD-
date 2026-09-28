"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  ClipboardList,
  CircleAlert,
  Clock3,
  FileText,
  Package2,
  Plus,
  RefreshCw,
  Search,
  Ship,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  rejectReason?: string | null;
  totalAmount: number | string | null;
  currency: string;
  createdAt: string;
  client?: { company: string; country?: string };
  items: { id: string; quantity: number | string; product?: { name: string } }[];
};

type OrderDetail = Omit<OrderSummary, "items"> & {
  incoterm: string;
  notes?: string | null;
  client: { company: string; country: string; vatId?: string; email?: string | null; address?: string };
  items: {
    id: string;
    quantity: number | string;
    unitPrice: number | string;
    lot?: { traceabilityCode: string; status: string } | null;
    product: { name: string; variety: string; type: string };
  }[];
};

type Metrics = { products: number; lots: number; clients: number };

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Revisión requerida",
  CONFIRMADO: "Aprobado",
  RECHAZADO: "Rechazado",
  ENVIADO: "En tránsito",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const statusClasses: Record<string, string> = {
  BORRADOR: "state-neutral",
  PENDIENTE_APROBACION: "state-review",
  CONFIRMADO: "state-ready",
  RECHAZADO: "state-danger",
  ENVIADO: "state-moving",
  ENTREGADO: "state-ready",
  CANCELADO: "state-neutral",
};

const statusOrder = ["PENDIENTE_APROBACION", "BORRADOR", "CONFIRMADO", "ENVIADO", "ENTREGADO", "RECHAZADO", "CANCELADO"];

const stages = [
  { label: "Lote", icon: Boxes },
  { label: "Cliente", icon: Users },
  { label: "Aprobación", icon: BadgeCheck },
  { label: "Documentos", icon: FileText },
  { label: "Envío", icon: Ship },
];

function formatAmount(value: number | string | null, currency = "EUR") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function stageIndex(status: string) {
  if (status === "BORRADOR" || status === "PENDIENTE_APROBACION") return 2;
  if (status === "CONFIRMADO") return 3;
  if (status === "ENVIADO") return 4;
  if (status === "ENTREGADO") return 5;
  return 0;
}

export default function OperationsPage() {
  const reduceMotion = useReducedMotion();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ products: 0, lots: 0, clients: 0 });
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRows, products, lots, clients] = await Promise.all([
        api.get<OrderSummary[]>("/orders"),
        api.get<unknown[]>("/products"),
        api.get<unknown[]>("/lots"),
        api.get<unknown[]>("/clients"),
      ]);
      const sorted = [...orderRows].sort((a, b) => {
        const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        return statusDiff || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setOrders(sorted);
      setMetrics({ products: products.length, lots: lots.length, clients: clients.length });
      setSelectedId((current) => current && sorted.some((order) => order.id === current) ? current : sorted[0]?.id ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo conectar con la API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    api.get<OrderDetail>(`/orders/${selectedId}`)
      .then((order) => { if (active) setDetail(order); })
      .catch(() => { if (active) setDetail(null); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [selectedId, orders]);

  const pendingCount = orders.filter((order) => order.status === "PENDIENTE_APROBACION").length;
  const readyCount = orders.filter((order) => order.status === "CONFIRMADO").length;
  const movingCount = orders.filter((order) => order.status === "ENVIADO").length;
  const visibleOrders = useMemo(() => orders.filter((order) => {
    const searchMatch = `${order.orderNumber} ${order.client?.company ?? ""} ${order.client?.country ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const statusMatch = filter === "ALL" || order.status === filter;
    return searchMatch && statusMatch;
  }), [filter, orders, query]);

  const selectedStage = detail ? stageIndex(detail.status) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-7">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]">Cola de exportación</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Sigue cada pedido desde el lote de origen hasta los documentos de salida.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void loadWorkspace()} disabled={loading} className="h-10 gap-2">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Actualizar
            </Button>
            <Link href="/orders">
              <Button className="h-10 gap-2"><Plus size={16} />Nuevo pedido</Button>
            </Link>
          </div>
        </div>

        <section aria-label="Resumen operativo" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="summary-cell summary-cell-primary">
            <p className="summary-label">En revisión</p>
            <p className="summary-value">{loading ? "—" : pendingCount.toString().padStart(2, "0")}</p>
            <p className="summary-note">Pendientes de aprobación</p>
          </div>
          <div className="summary-cell">
            <p className="summary-label">Listos para preparar</p>
            <p className="summary-value">{loading ? "—" : readyCount.toString().padStart(2, "0")}</p>
            <p className="summary-note">Pedidos aprobados</p>
          </div>
          <div className="summary-cell">
            <p className="summary-label">En tránsito</p>
            <p className="summary-value">{loading ? "—" : movingCount.toString().padStart(2, "0")}</p>
            <p className="summary-note">Con estado de envío</p>
          </div>
          <Link href="/lots" className="summary-cell summary-cell-link">
            <p className="summary-label">Lotes registrados</p>
            <p className="summary-value">{loading ? "—" : metrics.lots.toString().padStart(2, "0")}</p>
            <p className="summary-note">Consultar trazabilidad <ArrowUpRight size={12} /></p>
          </Link>
          <Link href="/clients" className="summary-cell summary-cell-link">
            <p className="summary-label">Clientes UE</p>
            <p className="summary-value">{loading ? "—" : metrics.clients.toString().padStart(2, "0")}</p>
            <p className="summary-note">Directorio comercial <ArrowUpRight size={12} /></p>
          </Link>
        </section>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.85fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h3 className="text-sm font-semibold">Manifiesto de pedidos</h3>
                <p className="mt-1 text-xs text-muted-foreground">{visibleOrders.length} registros en esta vista</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block sm:w-56">
                  <Search aria-hidden="true" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pedido o cliente" className="h-9 pl-9 text-xs" aria-label="Buscar pedido o cliente" />
                </label>
                <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filtrar pedidos por estado" className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground">
                  <option value="ALL">Todos los estados</option>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>

            {error && <div role="alert" className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error} Verifica que la API esté en ejecución.</div>}

            <div className="hidden overflow-x-auto sm:block">
              <table className="ledger-table min-w-[650px] text-left text-xs">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th className="text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => <tr key={index}><td colSpan={5}><div className="h-5 animate-pulse rounded bg-muted" /></td></tr>)
                  ) : visibleOrders.length === 0 ? (
                    <tr><td colSpan={5} className="py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <ClipboardList size={24} className="text-muted-foreground" />
                        <p className="mt-3 font-semibold">{query || filter !== "ALL" ? "No coincide ningún pedido" : "La cola está despejada"}</p>
                        <p className="mt-1 text-muted-foreground">{query || filter !== "ALL" ? "Cambia el término o el estado del filtro." : "Registra un pedido para iniciar el recorrido de exportación."}</p>
                        {!query && filter === "ALL" && <Link href="/orders" className="mt-4 text-xs font-semibold text-primary hover:underline">Crear el primer pedido <ArrowRight size={13} className="ml-1 inline" /></Link>}
                      </div>
                    </td></tr>
                  ) : visibleOrders.map((order) => {
                    const isSelected = order.id === selectedId;
                    return (
                      <tr key={order.id}>
                        <td colSpan={5} className="!p-0">
                          <button
                            type="button"
                            onClick={() => setSelectedId(order.id)}
                            aria-pressed={isSelected}
                            className={`grid w-full grid-cols-[1.05fr_1.4fr_1.05fr_0.9fr_1fr] items-center gap-3 px-[14px] py-[13px] text-left transition-colors ${isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"}`}
                          >
                            <span className="font-mono text-[11px] font-semibold text-primary">{order.orderNumber}</span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground">{order.client?.company ?? "Cliente sin nombre"}</span>
                              <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{order.client?.country ?? "Destino por confirmar"}</span>
                            </span>
                            <span className={`status-pill ${statusClasses[order.status] ?? "state-neutral"}`}>{order.status === "BORRADOR" && order.rejectReason ? "Devuelto a borrador" : statusLabels[order.status] ?? order.status}</span>
                            <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                            <span className="text-right font-semibold tabular-nums">{formatAmount(order.totalAmount, order.currency)}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border sm:hidden">
              {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="p-4"><div className="h-12 animate-pulse rounded bg-muted" /></div>) : visibleOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">{query || filter !== "ALL" ? "No hay coincidencias." : "No hay pedidos en la cola."}</div>
              ) : visibleOrders.map((order) => (
                <button key={order.id} type="button" onClick={() => setSelectedId(order.id)} aria-pressed={order.id === selectedId} className={`block w-full p-4 text-left ${order.id === selectedId ? "bg-blue-50/80" : "bg-card"}`}>
                  <span className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] font-semibold text-primary">{order.orderNumber}</span><span className={`status-pill ${statusClasses[order.status] ?? "state-neutral"}`}>{order.status === "BORRADOR" && order.rejectReason ? "Devuelto a borrador" : statusLabels[order.status] ?? order.status}</span></span>
                  <span className="mt-2 block truncate text-xs font-semibold">{order.client?.company ?? "Cliente sin nombre"}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"><span>{order.client?.country ?? "Destino por confirmar"} · {formatDate(order.createdAt)}</span><span className="shrink-0 font-semibold text-foreground">{formatAmount(order.totalAmount, order.currency)}</span></span>
                </button>
              ))}
            </div>
          </section>

          <aside aria-label="Expediente del pedido seleccionado" className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {detail ? (
                <motion.div
                  key={detail.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-border p-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Expediente seleccionado</p>
                      <h3 className="mt-2 truncate font-mono text-lg font-semibold text-foreground">{detail.orderNumber}</h3>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{detail.client.company} · {detail.client.country}</p>
                    </div>
                    <span className={`status-pill shrink-0 ${statusClasses[detail.status] ?? "state-neutral"}`}>{statusLabels[detail.status] ?? detail.status}</span>
                  </div>

                  <div className="border-b border-border px-5 py-4">
                    <div className="space-y-0">
                      {stages.map(({ label, icon: Icon }, index) => {
                        const complete = selectedStage > index;
                        const current = selectedStage === index && selectedStage < stages.length;
                        return (
                          <div key={label} className="relative flex gap-3 pb-4 last:pb-0">
                            {index < stages.length - 1 && <span className={`absolute left-[10px] top-[22px] h-[calc(100%-8px)] w-px ${complete ? "bg-primary" : "bg-border"}`} aria-hidden="true" />}
                            <span className={`relative z-10 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border ${complete || current ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`}>
                              <Icon size={11} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1 pt-0.5">
                              <span className={`block text-xs font-semibold ${current ? "text-primary" : "text-foreground"}`}>{label}</span>
                              {label === "Lote" && <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{detail.items.map((item) => item.lot?.traceabilityCode ?? "Lote pendiente").join(" · ")}</span>}
                              {label === "Cliente" && <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{detail.client.company}</span>}
                              {label === "Aprobación" && <span className="mt-0.5 block text-[10px] text-muted-foreground">{detail.status === "BORRADOR" && detail.rejectReason ? "Devuelto con observación" : statusLabels[detail.status] ?? detail.status}</span>}
                              {label === "Documentos" && <span className="mt-0.5 block text-[10px] text-muted-foreground">Proforma y packing list</span>}
                              {label === "Envío" && <span className="mt-0.5 block text-[10px] text-muted-foreground">{detail.status === "ENVIADO" || detail.status === "ENTREGADO" ? "En seguimiento" : "Pendiente de aprobación"}</span>}
                            </span>
                            {complete && <BadgeCheck size={15} className="mt-1 text-success" aria-label="Completado" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Mercancía</p>
                      <div className="mt-2 space-y-2">
                        {detail.items.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{item.product.name}</span>
                              <span className="mt-0.5 block truncate text-muted-foreground">{item.lot?.traceabilityCode ?? "Sin lote asociado"} · {item.product.variety}</span>
                            </span>
                            <span className="shrink-0 font-mono text-muted-foreground">{Number(item.quantity).toLocaleString("es-CO")} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                      <span className="text-muted-foreground">Incoterm · {detail.incoterm}</span>
                      <span className="font-semibold tabular-nums">{formatAmount(detail.totalAmount, detail.currency)}</span>
                    </div>
                    <Link href={`/orders/${detail.id}`} className="block">
                      <Button className="w-full justify-between" variant="outline">
                        Abrir expediente <ArrowRight size={15} />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                  {detailLoading ? <RefreshCw className="mx-auto animate-spin text-primary" size={20} /> : <CircleAlert className="mx-auto text-muted-foreground" size={20} />}
                  <p className="mt-3 text-sm font-semibold">{detailLoading ? "Abriendo expediente…" : "Selecciona un pedido"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Su recorrido, lote y documentos aparecerán aquí.</p>
                </div>
              )}
            </AnimatePresence>
          </aside>
        </div>

        <section className="flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold">También puedes consultar</h3>
            <p className="mt-1 text-xs text-muted-foreground">Catálogo, trazabilidad e historial documental.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className="quick-link"><Package2 size={15} /> Productos ({metrics.products}) <ArrowDownRight size={13} /></Link>
            <Link href="/lots" className="quick-link"><Boxes size={15} /> Lotes <ArrowDownRight size={13} /></Link>
            <Link href="/certificates" className="quick-link"><BadgeCheck size={15} /> Certificados <ArrowDownRight size={13} /></Link>
            <Link href="/documents" className="quick-link"><Clock3 size={15} /> Documentos <ArrowDownRight size={13} /></Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
