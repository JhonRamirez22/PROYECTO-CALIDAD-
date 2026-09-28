"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Plus, Search, Waypoints } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type Product = { id: string; name: string; type: string; variety: string; origin: string };
type Lot = { id: string; traceabilityCode: string; productId: string; status: string; weight: number | string; harvestDate: string | null; processDate: string | null; originLocation: string | null; product: Product; _count: { orderItems: number } };

const statusLabels: Record<string, string> = { DISPONIBLE: "Disponible", RESERVADO: "Reservado", ENVIADO: "Enviado", CERTIFICADO: "Certificado" };
const emptyLot = { productId: "", weight: "", originLocation: "", harvestDate: "", processDate: "", notes: "" };

export default function LotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyLot);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotRows, productRows] = await Promise.all([api.get<Lot[]>("/lots"), api.get<Product[]>("/products")]);
      setLots(lotRows); setProducts(productRows); setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar productos y lotes.");
    } finally { setLoading(false); }
  };
  useEffect(() => { void loadData(); }, []);

  const filtered = useMemo(() => lots.filter((lot) => {
    const searchMatch = `${lot.traceabilityCode} ${lot.product?.name ?? ""} ${lot.product?.origin ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return searchMatch && (statusFilter === "ALL" || lot.status === statusFilter);
  }), [lots, query, statusFilter]);

  const createLot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await api.post("/lots", { ...form, weight: Number(form.weight), harvestDate: form.harvestDate || undefined, processDate: form.processDate || undefined });
      setForm(emptyLot); setShowCreate(false); setNotice("Lote creado con código de trazabilidad automático."); await loadData();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "No se pudo crear el lote."); }
    finally { setSaving(false); }
  };

  const changeStatus = async (lot: Lot, status: string) => {
    setError(""); setNotice("");
    try {
      await api.put(`/lots/${lot.id}`, { status });
      setNotice(`${lot.traceabilityCode}: estado actualizado a ${statusLabels[status]}.`);
      await loadData();
    } catch (statusError) { setError(statusError instanceof Error ? statusError.message : "No se pudo cambiar el estado."); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="flex items-center gap-2 text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]"><Boxes className="text-primary" size={24} />Lotes y trazabilidad</h2><p className="mt-1 text-sm text-muted-foreground">Registra el origen, las fechas de cosecha y el estado operativo de cada lote.</p></div>
          <Button onClick={() => { setShowCreate((visible) => !visible); setError(""); }} className="gap-2"><Plus size={16} />Nuevo lote</Button>
        </div>
        {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {showCreate && <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="new-lot-title">
          <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-primary"><Waypoints size={17} /></span><div><h3 id="new-lot-title" className="font-semibold">Nuevo lote</h3><p className="mt-1 text-xs text-muted-foreground">El sistema asignará un código único al guardar.</p></div></div>
          <form onSubmit={createLot} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="lot-product">Producto</Label><select id="lot-product" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Seleccionar producto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.origin}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="lot-weight">Peso disponible (kg)</Label><Input id="lot-weight" type="number" min="0.01" step="0.01" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="lot-origin">Ubicación de origen</Label><Input id="lot-origin" value={form.originLocation} onChange={(event) => setForm({ ...form, originLocation: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="lot-harvest">Fecha de cosecha</Label><Input id="lot-harvest" type="date" value={form.harvestDate} onChange={(event) => setForm({ ...form, harvestDate: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lot-process">Fecha de procesamiento</Label><Input id="lot-process" type="date" value={form.processDate} onChange={(event) => setForm({ ...form, processDate: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lot-notes">Notas de trazabilidad</Label><Input id="lot-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
            <div className="flex gap-2 sm:col-span-2 xl:col-span-3"><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Registrar lote"}</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button></div>
          </form>
        </section>}

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(220px,1fr)_200px]"><label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar lote" placeholder="Código, producto u origen" className="h-9 pl-9 text-xs" /></label><select aria-label="Filtrar estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="ALL">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          {loading ? <p className="p-5 text-sm text-muted-foreground">Cargando lotes…</p> : filtered.length === 0 ? <p className="p-12 text-center text-sm text-muted-foreground">No hay lotes que coincidan con la búsqueda.</p> : (
            <div className="overflow-x-auto"><table className="ledger-table min-w-[740px] text-xs"><thead><tr><th>Código</th><th>Producto / origen</th><th>Cosecha</th><th className="text-right">Peso</th><th>Estado</th><th>Pedidos</th><th>Cambiar estado</th></tr></thead><tbody>
              {filtered.map((lot) => <tr key={lot.id}>
                <td><Link href={`/lots/${lot.id}`} className="font-mono font-semibold text-primary hover:underline">{lot.traceabilityCode}</Link></td>
                <td><span className="block font-semibold">{lot.product.name}</span><span className="mt-1 block text-[10px] text-muted-foreground">{lot.originLocation ?? lot.product.origin}</span></td>
                <td>{lot.harvestDate ? new Date(lot.harvestDate).toLocaleDateString("es-CO") : "—"}</td>
                <td className="text-right font-mono tabular-nums">{Number(lot.weight).toLocaleString("es-CO")} kg</td>
                <td><span className={`status-pill ${lot.status === "DISPONIBLE" ? "state-ready" : lot.status === "RESERVADO" ? "state-review" : lot.status === "ENVIADO" ? "state-moving" : "state-neutral"}`}>{statusLabels[lot.status] ?? lot.status}</span></td>
                <td>{lot._count?.orderItems ?? 0}</td>
                <td><select aria-label={`Estado para ${lot.traceabilityCode}`} value={lot.status} onChange={(event) => void changeStatus(lot, event.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-[11px]">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
              </tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
