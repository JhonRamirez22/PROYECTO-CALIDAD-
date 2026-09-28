"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Coffee, Leaf, PackagePlus, Search } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type Product = { id: string; name: string; type: "CAFE" | "CACAO"; variety: string; origin: string; altitude?: string | null; process?: string | null; description?: string | null; active: boolean; _count?: { lots: number; orderItems: number } };
const emptyForm = { name: "", type: "CAFE", variety: "", origin: "Nariño, Colombia", altitude: "", process: "", description: "" };

export default function ProductsPage() {
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadProducts = async () => {
    setLoading(true);
    try { setProducts(await api.get<Product[]>("/products")); setError(""); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el catálogo."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadProducts(); }, []);

  const filtered = useMemo(() => products.filter((product) => {
    const search = `${product.name} ${product.variety} ${product.origin}`.toLowerCase().includes(query.toLowerCase());
    const typeMatch = typeFilter === "ALL" || product.type === typeFilter;
    const activeMatch = activeFilter === "ALL" || product.active === (activeFilter === "ACTIVE");
    return search && typeMatch && activeMatch;
  }), [products, query, typeFilter, activeFilter]);

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await api.post("/products", { ...form, name: form.name.trim(), variety: form.variety.trim(), origin: form.origin.trim(), altitude: form.altitude || undefined, process: form.process || undefined, description: form.description || undefined });
      setForm(emptyForm); setShowCreate(false); setNotice("Producto registrado en el catálogo."); await loadProducts();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el producto."); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]">Catálogo de origen</h2><p className="mt-1 text-sm text-muted-foreground">Café y cacao de Nariño para vincular a lotes de exportación.</p></div>
          <Button onClick={() => { setShowCreate((value) => !value); setError(""); }} className="gap-2"><PackagePlus size={16} />Nuevo producto</Button>
        </div>
        {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <AnimatePresence initial={false}>
          {showCreate && <motion.section initial={reduceMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduceMotion ? undefined : { opacity: 0, height: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="new-product-title">
            <form onSubmit={createProduct} className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <div className="sm:col-span-2 xl:col-span-3"><h3 id="new-product-title" className="font-semibold">Ficha de producto</h3><p className="mt-1 text-xs text-muted-foreground">RiTech trabaja exclusivamente con café y cacao de Nariño. La combinación de variedad y origen debe ser única.</p></div>
              <div className="space-y-2"><Label htmlFor="product-name">Nombre</Label><Input id="product-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="product-type">Familia</Label><select id="product-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="CAFE">Café</option><option value="CACAO">Cacao</option></select></div>
              <div className="space-y-2"><Label htmlFor="product-variety">Variedad</Label><Input id="product-variety" value={form.variety} onChange={(event) => setForm({ ...form, variety: event.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="product-origin">Origen geográfico</Label><Input id="product-origin" value={form.origin} readOnly aria-describedby="product-origin-help" required /><p id="product-origin-help" className="text-xs text-muted-foreground">Todos los productos del catálogo deben provenir de Nariño.</p></div>
              <div className="space-y-2"><Label htmlFor="product-altitude">Altitud</Label><Input id="product-altitude" value={form.altitude} onChange={(event) => setForm({ ...form, altitude: event.target.value })} placeholder="1.800 m" /></div>
              <div className="space-y-2"><Label htmlFor="product-process">Proceso</Label><Input id="product-process" value={form.process} onChange={(event) => setForm({ ...form, process: event.target.value })} placeholder="Lavado, natural…" /></div>
              <div className="space-y-2 sm:col-span-2 xl:col-span-3"><Label htmlFor="product-description">Descripción</Label><Input id="product-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
              <div className="flex gap-2 sm:col-span-2 xl:col-span-3"><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar producto"}</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button></div>
            </form>
          </motion.section>}
        </AnimatePresence>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(220px,1fr)_160px_160px]">
            <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, variedad u origen" aria-label="Buscar productos" className="h-9 pl-9 text-xs" /></label>
            <select aria-label="Filtrar familia" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="ALL">Café y cacao</option><option value="CAFE">Café</option><option value="CACAO">Cacao</option></select>
            <select aria-label="Filtrar estado del producto" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="ALL">Todos los estados</option><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></select>
          </div>
          {loading ? <p className="p-5 text-sm text-muted-foreground">Cargando catálogo…</p> : filtered.length === 0 ? <p className="p-12 text-center text-sm text-muted-foreground">No hay productos que coincidan con la búsqueda.</p> : (
            <div className="overflow-x-auto"><table className="ledger-table min-w-[640px] text-xs"><thead><tr><th>Producto</th><th>Variedad</th><th>Origen</th><th>Proceso</th><th>Lotes</th><th>Pedidos</th></tr></thead><tbody>
              {filtered.map((product) => <tr key={product.id}>
                <td><span className="flex items-center gap-2 font-semibold">{product.type === "CAFE" ? <Coffee size={14} className="text-primary" /> : <Leaf size={14} className="text-accent" />}{product.name}</span><span className="mt-1 block text-[10px] text-muted-foreground">{product.type === "CAFE" ? "Café" : "Cacao"}{product.altitude ? ` · ${product.altitude}` : ""}</span></td>
                <td>{product.variety}</td><td>{product.origin}</td><td className="text-muted-foreground">{product.process ?? "—"}</td><td><span className={`status-pill ${product.active ? "state-ready" : "state-neutral"}`}>{product.active ? "Activo" : "Inactivo"}</span><span className="ml-2 text-muted-foreground">{product._count?.lots ?? 0} lotes</span></td><td>{product._count?.orderItems ?? 0}</td>
              </tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
