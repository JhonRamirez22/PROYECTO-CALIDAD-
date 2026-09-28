"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, CheckCircle, XCircle, FlaskConical } from "lucide-react";
import { api } from "@/lib/api";

interface QualitySample {
  id: string;
  lotId: string;
  sampleType: string;
  sc: {
    score: number;
    acidity: number | null;
    body: number | null;
    sweetness: number | null;
    aftertaste: number | null;
    uniformity: number | null;
    cuppingNotes: string | null;
  };
  submittedBy: string;
  submittedAt: string;
  lot?: { traceabilityCode: string; product?: { name: string } };
}

interface Lot { id: string; traceabilityCode: string; }

export default function QualitySamplePage() {
  const [samples, setSamples] = useState<QualitySample[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState<QualitySample | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    lotId: "",
    sampleType: "OWN_SAMPLE",
    score: "",
    acidity: "",
    body: "",
    sweetness: "",
    aftertaste: "",
    uniformity: "",
    cuppingNotes: "",
  });
  const [verifyForm, setVerifyForm] = useState({ toleranceSCA: "2" });

  useEffect(() => { fetchSamples(); fetchLots(); }, []);

  const fetchSamples = async () => {
    try { setSamples(await api.get<QualitySample[]>("/quality-sample")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLots = async () => {
    try { setLots(await api.get<Lot[]>("/lots")); }
    catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/quality-sample", {
        lotId: form.lotId,
        sampleType: form.sampleType,
        sc: {
          score: Number(form.score),
          acidity: form.acidity ? Number(form.acidity) : undefined,
          body: form.body ? Number(form.body) : undefined,
          sweetness: form.sweetness ? Number(form.sweetness) : undefined,
          aftertaste: form.aftertaste ? Number(form.aftertaste) : undefined,
          uniformity: form.uniformity ? Number(form.uniformity) : undefined,
        },
        cuppingNotes: form.cuppingNotes || undefined,
      });
      setDialogOpen(false);
      setForm({ lotId: "", sampleType: "OWN_SAMPLE", score: "", acidity: "", body: "", sweetness: "", aftertaste: "", uniformity: "", cuppingNotes: "" });
      fetchSamples();
    } finally { setSubmitting(false); }
  };

  const handleVerify = async () => {
    if (!verifyDialog) return;
    setSubmitting(true);
    try {
      await api.post(`/quality-sample/${verifyDialog.lotId}/verify`, {
        toleranceSCA: Number(verifyForm.toleranceSCA),
      });
      setVerifyDialog(null);
      fetchSamples();
    } finally { setSubmitting(false); }
  };

  const filtered = samples.filter((s) => {
    const q = search.toLowerCase();
    return (s.lot?.traceabilityCode ?? "").toLowerCase().includes(q) ||
      (s.lot?.product?.name ?? "").toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Verificación de Muestras</h1>
            <p className="text-muted-foreground">Control de calidad: muestra del propietario vs. verificación</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Registrar Muestra
          </Button>
        </div>

        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto ring-1 ring-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Registrar Muestra de Calidad</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Lote *</Label>
                  <Select value={form.lotId} onValueChange={(v) => setForm({ ...form, lotId: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar lote" /></SelectTrigger>
                    <SelectContent>
                      {lots.map((l) => <SelectItem key={l.id} value={l.id}>{l.traceabilityCode}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de muestra *</Label>
                  <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v ?? "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWN_SAMPLE">Muestra propia (propietario)</SelectItem>
                      <SelectItem value="EXTERNAL">Muestra externa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Puntaje SCA *</Label>
                  <Input type="number" step="0.1" min="0" max="100" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} placeholder="85.5" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Acidez (0-10)</Label>
                    <Input type="number" step="0.5" min="0" max="10" value={form.acidity} onChange={(e) => setForm({ ...form, acidity: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cuerpo (0-10)</Label>
                    <Input type="number" step="0.5" min="0" max="10" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dulzura (0-10)</Label>
                    <Input type="number" step="0.5" min="0" max="10" value={form.sweetness} onChange={(e) => setForm({ ...form, sweetness: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Regusto (0-10)</Label>
                    <Input type="number" step="0.5" min="0" max="10" value={form.aftertaste} onChange={(e) => setForm({ ...form, aftertaste: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas de cata</Label>
                  <Input value={form.cuppingNotes} onChange={(e) => setForm({ ...form, cuppingNotes: e.target.value })} placeholder="Notas frutales, chocolate, etc." />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Registrando..." : "Registrar"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {verifyDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-sm ring-1 ring-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Verificar Calidad</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setVerifyDialog(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Comparar muestra del propietario con verificación para el lote <strong>{verifyDialog.lot?.traceabilityCode}</strong>
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tolerancia SCA (±puntos)</Label>
                  <Input type="number" step="0.5" min="0" value={verifyForm.toleranceSCA} onChange={(e) => setVerifyForm({ ...verifyForm, toleranceSCA: e.target.value })} />
                </div>
                <Button onClick={handleVerify} className="w-full" disabled={submitting}>
                  {submitting ? "Verificando..." : "Ejecutar Verificación"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por lote o producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando muestras...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron muestras de calidad</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((sample) => (
              <Card key={sample.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span className="font-mono text-sm font-medium text-primary">{sample.lot?.traceabilityCode}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sample.sampleType === "OWN_SAMPLE" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {sample.sampleType === "OWN_SAMPLE" ? "Propia" : "Externa"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{sample.sc.score}</span>
                    <span className="text-xs text-muted-foreground">SCA</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{sample.lot?.product?.name}</p>
                  {sample.sc.cuppingNotes && (
                    <p className="text-sm text-muted-foreground italic mb-3">&ldquo;{sample.sc.cuppingNotes}&rdquo;</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{new Date(sample.submittedAt).toLocaleDateString("es-CO")}</span>
                    <button onClick={() => setVerifyDialog(sample)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                      <FlaskConical className="h-3 w-3" />Verificar
                    </button>
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
