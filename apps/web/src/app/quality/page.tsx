"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Star } from "lucide-react";
import { api } from "@/lib/api";

interface QualityAnalysis {
  id: string;
  analyst: string;
  analyzedAt: string;
  fragrance: number;
  flavor: number;
  aftertaste: number;
  acidity: number;
  body: number;
  balance: number;
  uniformity: number;
  sweetness: number;
  cleanCup: number;
  overall: number;
  totalScore: string | number;
  defects: number;
  notes: string | null;
  lot: { traceabilityCode: string; product: { name: string } };
}

interface Lot { id: string; traceabilityCode: string; product: { name: string }; }

const ATTRS = [
  { key: "fragrance", label: "Fragancia" },
  { key: "flavor", label: "Sabor" },
  { key: "aftertaste", label: "Retrogusto" },
  { key: "acidity", label: "Acidez" },
  { key: "body", label: "Cuerpo" },
  { key: "balance", label: "Balance" },
  { key: "uniformity", label: "Uniformidad" },
  { key: "sweetness", label: "Dulzura" },
  { key: "cleanCup", label: "Taza Limpia" },
  { key: "overall", label: "General" },
] as const;

type AttrKey = (typeof ATTRS)[number]["key"];

function scoreLabel(total: number) {
  if (total >= 90) return { text: "Excelente", cls: "bg-success/10 text-success" };
  if (total >= 80) return { text: "Muy bueno", cls: "bg-success/10 text-success" };
  if (total >= 70) return { text: "Comercial", cls: "bg-warning/10 text-warning" };
  return { text: "Bajo grado", cls: "bg-destructive/10 text-destructive" };
}

export default function QualityPage() {
  const [analyses, setAnalyses] = useState<QualityAnalysis[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    lotId: "",
    analyst: "",
    notes: "",
    ...Object.fromEntries(ATTRS.map((a) => [a.key, 7])) as Record<AttrKey, number>,
  });

  useEffect(() => { fetchAnalyses(); fetchLots(); }, []);

  const fetchAnalyses = async () => {
    try { setAnalyses(await api.get<QualityAnalysis[]>("/quality")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLots = async () => {
    try { setLots(await api.get<Lot[]>("/lots")); }
    catch (e) { console.error(e); }
  };

  const liveTotal = ATTRS.reduce((sum, a) => sum + (Number(form[a.key]) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/quality", { ...form, lotId: form.lotId });
      setDialogOpen(false);
      setForm({ ...form, lotId: "", analyst: "", notes: "" });
      fetchAnalyses();
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Calidad SCA</h1>
            <p className="text-muted-foreground">Análisis de catación por lote</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nueva Catación
          </Button>
        </div>

        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ring-1 ring-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Registro de Catación SCA</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Lote *</Label>
                    <Select value={form.lotId} onValueChange={(v) => setForm({ ...form, lotId: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar lote" /></SelectTrigger>
                      <SelectContent>
                        {lots.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.traceabilityCode} — {l.product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Catador *</Label>
                    <Input value={form.analyst} onChange={(e) => setForm({ ...form, analyst: e.target.value })} placeholder="Q-Grader..." required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {ATTRS.map((a) => (
                    <div key={a.key} className="flex items-center gap-2">
                      <span className="w-24 text-xs text-muted-foreground">{a.label}</span>
                      <input
                        type="number" min={0} max={10} step={1}
                        value={form[a.key]}
                        onChange={(e) => setForm({ ...form, [a.key]: Number(e.target.value) })}
                        className="w-16 rounded-md border bg-transparent px-2 py-1 text-sm"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                  <span className="text-sm text-muted-foreground">Puntaje total SCA</span>
                  <span className={`font-heading text-xl font-bold ${liveTotal >= 80 ? "text-success" : liveTotal >= 70 ? "text-warning" : "text-destructive"}`}>
                    {liveTotal}/100
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>Notas de cata</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Chocolate, cítricos, caramelo..." />
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !form.lotId || !form.analyst}>
                  {submitting ? "Registrando..." : "Registrar Análisis"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Cargando análisis...</p>
        ) : analyses.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No hay análisis de calidad registrados</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((a) => {
              const total = Number(a.totalScore);
              const lbl = scoreLabel(total);
              return (
                <Card key={a.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-sm font-medium text-primary">{a.lot.traceabilityCode}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lbl.cls}`}>{lbl.text}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 fill-warning text-warning" />
                      <span className="font-heading text-2xl font-bold">{total.toFixed(2)}<span className="text-sm text-muted-foreground font-normal">/100</span></span>
                    </div>
                    <h3 className="font-heading font-semibold">{a.lot.product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.analyst} · {new Date(a.analyzedAt).toLocaleDateString("es-CO")}{a.defects > 0 ? ` · ${a.defects} defectos` : ""}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-2 italic">&ldquo;{a.notes}&rdquo;</p>}
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
