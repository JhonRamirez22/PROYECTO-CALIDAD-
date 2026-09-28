"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Download, FilePlus2, Search, ShieldAlert, Trash2, UploadCloud } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type Certificate = {
  id: string;
  type: string;
  number: string;
  issuer: string;
  documentFormat?: string | null;
  countryOfOrigin?: string | null;
  issuedAt: string;
  expiresAt: string | null;
  fileUrl: string | null;
  notes: string | null;
  product?: { name: string } | null;
  lot?: { traceabilityCode: string } | null;
  shipment?: { shipmentNumber: string; destination?: { name: string; country: string } } | null;
};

type Option = { id: string; name?: string; traceabilityCode?: string; shipmentNumber?: string; destination?: { name: string; country: string; certificateFormats?: string[] } };

const typeLabels: Record<string, string> = {
  ORGANICO: "Orgánico",
  FAIR_TRADE: "Fair Trade",
  RAINFOREST_ALLIANCE: "Rainforest Alliance",
  ORIGEN: "Origen",
  FITOSANITARIO: "Fitosanitario",
  EUDR: "EUDR",
  CALIDAD: "Calidad",
};

const typeHelp: Record<string, string> = {
  CALIDAD: "Asocia el certificado a un producto o lote.",
  FITOSANITARIO: "Asocia el certificado al envío y al lote exportado.",
  ORIGEN: "Registra el formato del certificado junto al envío.",
};

function expiryState(expiresAt: string | null) {
  if (!expiresAt) return { label: "Sin vencimiento", style: "state-neutral", filter: "VIGENTE" };
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: "Vencido", style: "state-danger", filter: "VENCIDO" };
  if (days <= 30) return { label: `Vence en ${days} días`, style: "state-review", filter: "POR_VENCER" };
  return { label: "Vigente", style: "state-ready", filter: "VIGENTE" };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [products, setProducts] = useState<Option[]>([]);
  const [lots, setLots] = useState<Option[]>([]);
  const [shipments, setShipments] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [issuedFrom, setIssuedFrom] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    type: "CALIDAD",
    productId: "",
    lotId: "",
    shipmentId: "",
    number: "",
    issuer: "",
    documentFormat: "",
    countryOfOrigin: "Colombia",
    issuedAt: new Date().toISOString().slice(0, 10),
    expiresAt: "",
    notes: "",
  });

  const loadReferenceData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (issuedFrom) params.set("issuedFrom", issuedFrom);
      if (issuedTo) params.set("issuedTo", issuedTo);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const queryString = params.toString();
      const [certs, productRows, lotRows, shipmentRows] = await Promise.all([
        api.get<Certificate[]>(`/certificates${queryString ? `?${queryString}` : ""}`),
        api.get<Option[]>("/products"),
        api.get<Option[]>("/lots"),
        api.get<Option[]>("/shipments"),
      ]);
      setCertificates(certs);
      setProducts(productRows);
      setLots(lotRows);
      setShipments(shipmentRows);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar certificados y referencias.");
    } finally {
      setLoading(false);
    }
  }, [issuedFrom, issuedTo, statusFilter]);

  useEffect(() => { void loadReferenceData(); }, [loadReferenceData]);

  const isExportDocument = form.type === "FITOSANITARIO" || form.type === "ORIGEN";
  const allowedOriginFormats = shipments.find((shipment) => shipment.id === form.shipmentId)?.destination?.certificateFormats ?? [];
  const filteredCertificates = useMemo(() => certificates.filter((certificate) => {
    const haystack = [certificate.number, certificate.issuer, certificate.lot?.traceabilityCode, certificate.product?.name, certificate.shipment?.shipmentNumber].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase());
  }), [certificates, query]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const created = await api.post<Certificate>("/certificates", {
        type: form.type,
        productId: form.productId || undefined,
        lotId: form.lotId || undefined,
        shipmentId: form.shipmentId || undefined,
        number: form.number.trim(),
        issuer: form.issuer.trim(),
        documentFormat: form.documentFormat || undefined,
        countryOfOrigin: form.countryOfOrigin.trim() || undefined,
        issuedAt: form.issuedAt,
        expiresAt: form.expiresAt || undefined,
        notes: form.notes.trim() || undefined,
      });

      if (selectedFile) {
        const body = new FormData();
        body.set("file", selectedFile);
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/certificates/${created.id}/file`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body,
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message ?? "El certificado quedó registrado, pero no se pudo adjuntar el archivo.");
        }
      }

      setNotice("Certificado registrado y vinculado a su expediente.");
      setShowForm(false);
      setSelectedFile(null);
      setForm({ type: "CALIDAD", productId: "", lotId: "", shipmentId: "", number: "", issuer: "", documentFormat: "", countryOfOrigin: "Colombia", issuedAt: new Date().toISOString().slice(0, 10), expiresAt: "", notes: "" });
      await loadReferenceData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el certificado.");
    } finally {
      setSaving(false);
    }
  };

  const download = async (certificate: Certificate) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/certificates/${certificate.id}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("No se pudo descargar el adjunto.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `certificado-${certificate.number}`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "No se pudo descargar el archivo.");
    }
  };

  const remove = async (certificate: Certificate) => {
    if (!window.confirm(`¿Eliminar el certificado ${certificate.number}?`)) return;
    try {
      await api.delete(`/certificates/${certificate.id}`);
      await loadReferenceData();
      setNotice("Certificado eliminado.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "No se pudo eliminar el certificado.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]">Certificados</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Calidad, origen y documentación fitosanitaria asociadas al lote y al envío.</p>
          </div>
          <Button onClick={() => { setShowForm((value) => !value); setError(""); }} className="gap-2"><FilePlus2 size={16} />Registrar certificado</Button>
        </div>

        {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        {showForm && (
          <section className="rounded-xl border border-border bg-card p-5 lg:p-6" aria-labelledby="certificate-form-title">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id="certificate-form-title" className="font-semibold">Nuevo certificado</h3>
                <p className="mt-1 text-xs text-muted-foreground">{typeHelp[form.type] ?? "Registra la certificación y vincúlala al producto, lote o envío."}</p>
              </div>
              <BadgeCheck className="text-primary" size={19} aria-hidden="true" />
            </div>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="certificate-type">Tipo</Label>
                <select id="certificate-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, documentFormat: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              {isExportDocument && (
                <div className="space-y-2">
                  <Label htmlFor="certificate-shipment">Envío asociado</Label>
                  <select id="certificate-shipment" required value={form.shipmentId} onChange={(event) => setForm({ ...form, shipmentId: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Seleccionar envío</option>
                    {shipments.map((shipment) => <option key={shipment.id} value={shipment.id}>{shipment.shipmentNumber} · {shipment.destination?.name ?? shipment.destination?.country ?? "Destino"}</option>)}
                  </select>
                </div>
              )}
                <div className="space-y-2">
                  <Label htmlFor="certificate-lot">Lote {form.type === "FITOSANITARIO" ? "asociado" : "(opcional)"}</Label>
                  <select id="certificate-lot" required={form.type === "FITOSANITARIO" || (!form.productId && !isExportDocument)} value={form.lotId} onChange={(event) => setForm({ ...form, lotId: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Seleccionar lote</option>
                  {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.traceabilityCode}</option>)}
                </select>
              </div>
              {(!isExportDocument || form.type === "ORIGEN") && (
                <div className="space-y-2">
                  <Label htmlFor="certificate-product">Producto {form.type === "ORIGEN" ? "exportado" : "(opcional si se elige lote)"}</Label>
                  <select id="certificate-product" required={form.type === "ORIGEN" && !form.lotId} value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="certificate-number">Número</Label>
                <Input id="certificate-number" value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} placeholder="CERT-2026-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate-issuer">Entidad emisora</Label>
                <Input id="certificate-issuer" value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} required />
              </div>
              {form.type === "ORIGEN" && <>
                <div className="space-y-2">
                  <Label htmlFor="certificate-origin">País de origen</Label>
                  <Input id="certificate-origin" value={form.countryOfOrigin} onChange={(event) => setForm({ ...form, countryOfOrigin: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-format">Formato</Label>
                  <select id="certificate-format" value={form.documentFormat} onChange={(event) => setForm({ ...form, documentFormat: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>
                    <option value="">Seleccionar</option>{allowedOriginFormats.map((format) => <option key={format} value={format}>{format}</option>)}
                  </select>
                  {form.shipmentId && allowedOriginFormats.length === 0 && <p className="text-[10px] text-warning">No hay formatos configurados para el destino de este envío.</p>}
                </div>
              </>}
              <div className="space-y-2">
                <Label htmlFor="certificate-issued">Fecha de emisión</Label>
                <Input id="certificate-issued" type="date" value={form.issuedAt} onChange={(event) => setForm({ ...form, issuedAt: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate-expires">Fecha de vencimiento</Label>
                <Input id="certificate-expires" type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificate-file">Adjunto (PDF, JPG o PNG · máximo 10 MB)</Label>
                <Input id="certificate-file" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
              </div>
              <div className="space-y-2 sm:col-span-2 xl:col-span-3">
                <Label htmlFor="certificate-notes">Notas</Label>
                <Input id="certificate-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
                <Button type="submit" disabled={saving} className="gap-2"><UploadCloud size={15} />{saving ? "Guardando…" : "Guardar certificado"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(220px,1fr)_180px_150px_150px]">
            <label className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Buscar certificados" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Número, lote, producto o envío" className="h-9 pl-9 text-xs" />
            </label>
            <select aria-label="Filtrar por vencimiento" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="ALL">Todos los estados</option><option value="VIGENTE">Vigente</option><option value="POR_VENCER">Por vencer</option><option value="VENCIDO">Vencido</option>
            </select>
            <Input aria-label="Emitidos desde" type="date" value={issuedFrom} onChange={(event) => setIssuedFrom(event.target.value)} className="h-9 text-xs" />
            <Input aria-label="Emitidos hasta" type="date" value={issuedTo} onChange={(event) => setIssuedTo(event.target.value)} className="h-9 text-xs" />
          </div>
          {loading ? <p className="p-5 text-sm text-muted-foreground">Cargando certificados…</p> : filteredCertificates.length === 0 ? (
            <div className="p-12 text-center"><ShieldAlert className="mx-auto text-muted-foreground" size={22} /><p className="mt-3 text-sm font-semibold">No hay certificados en esta búsqueda</p><p className="mt-1 text-xs text-muted-foreground">Ajusta los filtros o registra un certificado.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ledger-table min-w-[820px] text-xs">
                <thead><tr><th>Certificado</th><th>Vinculado a</th><th>Emisor</th><th>Emisión</th><th>Vencimiento</th><th>Archivo</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>
                  {filteredCertificates.map((certificate) => {
                    const state = expiryState(certificate.expiresAt);
                    const association = [certificate.shipment?.shipmentNumber, certificate.lot?.traceabilityCode, certificate.product?.name].filter(Boolean).join(" · ") || "Sin asociación";
                    return <tr key={certificate.id}>
                      <td><span className="block font-semibold">{typeLabels[certificate.type] ?? certificate.type}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{certificate.number}</span></td>
                      <td className="max-w-[220px] truncate text-muted-foreground">{association}</td>
                      <td>{certificate.issuer}</td>
                      <td>{new Date(certificate.issuedAt).toLocaleDateString("es-CO")}</td>
                      <td><span className={`status-pill ${state.style}`}>{state.label}</span></td>
                      <td>{certificate.fileUrl ? <button type="button" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" onClick={() => void download(certificate)}><Download size={13} />Descargar</button> : <span className="text-muted-foreground">Sin archivo</span>}</td>
                      <td className="text-right"><button type="button" className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive" onClick={() => void remove(certificate)} aria-label={`Eliminar certificado ${certificate.number}`}><Trash2 size={14} /><span className="sr-only">Eliminar</span></button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
