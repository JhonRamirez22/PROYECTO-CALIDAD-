"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, FileText, History, Leaf, Package2, Ship, Wheat } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { api } from "@/lib/api";

type Shipment = { shipmentNumber: string; destination?: { name: string; country: string } | null };
type LotDetail = {
  id: string;
  traceabilityCode: string;
  status: string;
  weight: string | number;
  harvestDate: string | null;
  processDate: string | null;
  originLocation: string | null;
  notes: string | null;
  product: { id: string; name: string; type: string; variety: string; origin: string; process: string | null };
  certificates: { id: string; type: string; number: string; issuer: string; issuedAt: string; expiresAt: string | null; fileUrl: string | null }[];
  qualityAnalyses: { id: string; totalScore: string | number; analyzedAt: string; analyst: string }[];
  history: { id: string; action: string; userName: string | null; createdAt: string; oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }[];
  orderItems: { id: string; quantity: string | number; order: { id: string; orderNumber: string; status: string; client: { company: string; country: string }; shipmentOrders: { shipment: Shipment }[] } }[];
};

const statusLabel: Record<string, string> = { DISPONIBLE: "Disponible", RESERVADO: "Reservado", ENVIADO: "Enviado", CERTIFICADO: "Certificado" };

export default function LotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lot, setLot] = useState<LotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get<LotDetail>(`/lots/${id}`).then((data) => { if (active) setLot(data); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la ficha del lote."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <DashboardLayout><p className="text-sm text-muted-foreground">Cargando trazabilidad…</p></DashboardLayout>;
  if (error || !lot) return <DashboardLayout><div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error || "Lote no encontrado."}</div></DashboardLayout>;

  const milestones = [
    { label: "Producto registrado", detail: lot.product.name, date: null, done: true, icon: Package2 },
    { label: "Cosecha", detail: lot.originLocation ?? lot.product.origin, date: lot.harvestDate, done: Boolean(lot.harvestDate), icon: Wheat },
    { label: "Procesamiento", detail: lot.product.process ?? "Proceso no especificado", date: lot.processDate, done: Boolean(lot.processDate), icon: Leaf },
    { label: "Certificación", detail: `${lot.certificates.length} certificado(s) vinculado(s)`, date: null, done: lot.certificates.length > 0, icon: BadgeCheck },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link href="/lots" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft size={14} />Volver a lotes</Link>
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="font-mono text-xs font-semibold text-primary">{lot.traceabilityCode}</p><h2 className="mt-2 text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]">Pasaporte de lote</h2><p className="mt-1 text-sm text-muted-foreground">{lot.product.name} · {lot.product.variety} · {lot.product.origin}</p></div>
          <span className={`status-pill ${lot.status === "DISPONIBLE" ? "state-ready" : lot.status === "RESERVADO" ? "state-review" : lot.status === "ENVIADO" ? "state-moving" : "state-neutral"}`}>{statusLabel[lot.status] ?? lot.status}</span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Recorrido registrado</h3><p className="mt-1 text-xs text-muted-foreground">Solo se marcan etapas con datos presentes en el sistema.</p></div><CalendarDays size={18} className="text-primary" /></div>
            <div className="mt-6 space-y-0">
              {milestones.map((step, index) => {
                const Icon = step.icon;
                return <div key={step.label} className="relative flex gap-4 pb-7 last:pb-0">
                  {index < milestones.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-12px)] w-px ${step.done ? "bg-primary/50" : "bg-border"}`} />}
                  <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${step.done ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`}><Icon size={14} /></span>
                  <div className="min-w-0 flex-1 pt-1"><p className="text-sm font-semibold">{step.label}</p><p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>{step.date && <p className="mt-1 text-[10px] text-muted-foreground">{new Date(step.date).toLocaleDateString("es-CO")}</p>}</div>
                  <span className={`mt-1 text-[10px] font-semibold ${step.done ? "text-success" : "text-muted-foreground"}`}>{step.done ? "Registrado" : "Pendiente"}</span>
                </div>;
              })}
              {lot.orderItems.map((line) => {
                const shipments = line.order.shipmentOrders.map((entry) => entry.shipment);
                return <div key={line.id} className="relative flex gap-4 border-t border-border pt-5 pb-2">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${shipments.length ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground"}`}><Ship size={14} /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Pedido {line.order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{line.order.client.company} · {line.order.client.country} · {Number(line.quantity).toLocaleString("es-CO")} kg</p>{shipments.length ? shipments.map((shipment) => <p key={shipment.shipmentNumber} className="mt-1 text-xs text-primary">{shipment.shipmentNumber} → {shipment.destination?.name ?? shipment.destination?.country ?? "destino pendiente"}</p>) : <p className="mt-1 text-[10px] text-muted-foreground">Destino de envío pendiente de registrar</p>}</div>
                  <Link href={`/orders/${line.order.id}`} className="mt-1 text-xs font-semibold text-primary hover:underline">Ver pedido</Link>
                </div>;
              })}
            </div>
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center gap-2"><History size={15} className="text-primary" /><h4 className="text-sm font-semibold">Historial de asignaciones</h4></div>
              {lot.history.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">Todavía no hay cambios de asignación registrados.</p> : <div className="mt-3 space-y-3">
                {lot.history.map((event) => {
                  const details = event.newValues ?? {};
                  const orderNumber = typeof details.orderNumber === "string" ? details.orderNumber : "el pedido";
                  const previousCode = typeof details.previousTraceabilityCode === "string" ? details.previousTraceabilityCode : "otro lote";
                  const kind = details.event === "ORDER_LOT_RELEASED" ? `Liberado de ${orderNumber} al cambiar de ${previousCode}` : `Reservado para ${orderNumber}`;
                  return <div key={event.id} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-xs font-medium">{kind}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(event.createdAt).toLocaleString("es-CO")}{event.userName ? ` · ${event.userName}` : ""}</p>
                  </div>;
                })}
              </div>}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Datos del lote</h3>
              <dl className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Peso</dt><dd className="font-mono font-semibold">{Number(lot.weight).toLocaleString("es-CO")} kg</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Producto</dt><dd className="text-right font-medium">{lot.product.type === "CAFE" ? "Café" : "Cacao"} · {lot.product.variety}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Cosecha</dt><dd>{lot.harvestDate ? new Date(lot.harvestDate).toLocaleDateString("es-CO") : "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Procesamiento</dt><dd>{lot.processDate ? new Date(lot.processDate).toLocaleDateString("es-CO") : "—"}</dd></div>
              </dl>
              {lot.notes && <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">{lot.notes}</p>}
            </section>
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2"><FileText size={16} className="text-primary" /><h3 className="font-semibold">Certificados y análisis</h3></div>
              {lot.certificates.length === 0 && lot.qualityAnalyses.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">Aún no hay certificados ni análisis vinculados.</p> : <div className="mt-3 space-y-3">{lot.certificates.map((certificate) => <div key={certificate.id} className="border-b border-border pb-2 last:border-0"><p className="text-xs font-semibold">{certificate.type} · {certificate.number}</p><p className="mt-1 text-[10px] text-muted-foreground">{certificate.issuer} · {new Date(certificate.issuedAt).toLocaleDateString("es-CO")}</p></div>)}{lot.qualityAnalyses.map((analysis) => <div key={analysis.id} className="text-xs"><span className="font-semibold">SCA {Number(analysis.totalScore).toFixed(1)}</span><span className="ml-2 text-muted-foreground">{new Date(analysis.analyzedAt).toLocaleDateString("es-CO")}</span></div>)}</div>}
              <Link href="/certificates" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">Ir a certificados</Link>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
