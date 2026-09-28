"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, X, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface FarmCertificate {
  id: string;
  farmName: string;
  farmAddress: string;
  farmLat: number | null;
  farmLng: number | null;
  certificationType: string;
  certNumber: string;
  certIssuer: string;
  certIssuedAt: string;
  certExpiresAt: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  notes: string | null;
}

const certTypeLabels: Record<string, string> = {
  ORGANICO: "Orgánico",
  FAIR_TRADE: "Fair Trade",
  RAINFOREST_ALLIANCE: "Rainforest Alliance",
  DENOMINACION_ORIGEN: "Denominación de Origen",
  CAFE_DIRECTO: "Café Directo",
};

export default function FarmCertificatesPage() {
  const [certs, setCerts] = useState<FarmCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    farmName: "",
    farmAddress: "",
    certificationType: "ORGANICO",
    certNumber: "",
    certIssuer: "",
    certIssuedAt: new Date().toISOString().slice(0, 10),
    certExpiresAt: "",
    notes: "",
  });

  useEffect(() => { fetchCerts(); }, []);

  const fetchCerts = async () => {
    try { setCerts(await api.get<FarmCertificate[]>("/farm-certificates")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/farm-certificates", {
        ...form,
        certExpiresAt: form.certExpiresAt || undefined,
      });
      setDialogOpen(false);
      setForm({ farmName: "", farmAddress: "", certificationType: "ORGANICO", certNumber: "", certIssuer: "", certIssuedAt: new Date().toISOString().slice(0, 10), certExpiresAt: "", notes: "" });
      fetchCerts();
    } finally { setSubmitting(false); }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.put(`/farm-certificates/${id}/verify`, {});
      fetchCerts();
    } catch (e) { console.error(e); }
  };

  const filtered = certs.filter((c) => {
    const q = search.toLowerCase();
    return c.farmName.toLowerCase().includes(q) || c.certNumber.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Certificados de Finca</h1>
            <p className="text-muted-foreground">Certificaciones de origen del productor</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nuevo Certificado
          </Button>
        </div>

        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto ring-1 ring-foreground/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold">Registrar Certificado de Finca</h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la finca *</Label>
                  <Input value={form.farmName} onChange={(e) => setForm({ ...form, farmName: e.target.value })} placeholder="Finca El Paraíso" required />
                </div>
                <div className="space-y-2">
                  <Label>Ubicación de la finca *</Label>
                  <Input value={form.farmAddress} onChange={(e) => setForm({ ...form, farmAddress: e.target.value })} placeholder="Nariño, Colombia" required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de certificación *</Label>
                  <select value={form.certificationType} onChange={(e) => setForm({ ...form, certificationType: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                    {Object.entries(certTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Número de certificado *</Label>
                    <Input value={form.certNumber} onChange={(e) => setForm({ ...form, certNumber: e.target.value })} placeholder="ORG-2026-001" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Entidad emisora *</Label>
                    <Input value={form.certIssuer} onChange={(e) => setForm({ ...form, certIssuer: e.target.value })} placeholder="Ecocert" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Fecha emisión *</Label>
                    <Input type="date" value={form.certIssuedAt} onChange={(e) => setForm({ ...form, certIssuedAt: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha vencimiento</Label>
                    <Input type="date" value={form.certExpiresAt} onChange={(e) => setForm({ ...form, certExpiresAt: e.target.value })} />
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

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por finca o número..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando certificados...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron certificados de finca</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cert) => (
              <Card key={cert.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span className="font-mono text-sm font-medium text-primary">{cert.certNumber}</span>
                    {cert.isVerified ? (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                        <CheckCircle className="h-3 w-3" />Verificado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                        <AlertCircle className="h-3 w-3" />Pendiente
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-semibold">{cert.farmName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{cert.farmAddress}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {certTypeLabels[cert.certificationType]} · {cert.certIssuer}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                    <span>Emitido: {new Date(cert.certIssuedAt).toLocaleDateString("es-CO")}</span>
                    {!cert.isVerified && (
                      <button onClick={() => handleVerify(cert.id)} className="text-primary hover:underline font-medium">Verificar</button>
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
