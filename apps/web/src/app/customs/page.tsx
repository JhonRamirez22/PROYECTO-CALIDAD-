"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, FileCheck } from "lucide-react";
import { api } from "@/lib/api";

interface CustomsDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  documentDate: string;
  exporterName: string;
  exporterTaxId: string | null;
  importerName: string;
  importerTaxId: string | null;
  goodsDescription: string;
  goodsValue: number;
  currency: string;
  hsCode: string | null;
  countryOfOrigin: string;
  destinationCountry: string;
  shipmentId: string | null;
  status: string;
  issuedDate: string | null;
  expiryDate: string | null;
  notes: string | null;
  shipment?: { shipmentNumber: string } | null;
}

const typeLabels: Record<string, string> = { DUA: "DUA (Declaración Única Aduanera)", SAD: "SAD (Single Administrative Document)" };

export default function CustomsPage() {
  const [docs, setDocs] = useState<CustomsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    documentType: "DUA", documentNumber: "", documentDate: "",
    exporterName: "", exporterTaxId: "", importerName: "", importerTaxId: "",
    goodsDescription: "", goodsValue: "", currency: "USD", hsCode: "",
    countryOfOrigin: "Colombia", destinationCountry: "", shipmentId: "",
    issuedDate: "", expiryDate: "", notes: "",
  });

  const load = async () => {
    try { setLoading(true); setDocs(await api.get<CustomsDocument[]>("/customs-documents")); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = docs.filter(d =>
    d.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.exporterName.toLowerCase().includes(search.toLowerCase()) ||
    d.importerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      const body: Record<string, unknown> = {
        documentType: form.documentType, documentNumber: form.documentNumber, documentDate: form.documentDate,
        exporterName: form.exporterName, importerName: form.importerName,
        goodsDescription: form.goodsDescription, goodsValue: parseFloat(form.goodsValue), currency: form.currency,
        countryOfOrigin: form.countryOfOrigin, destinationCountry: form.destinationCountry,
      };
      if (form.exporterTaxId) body.exporterTaxId = form.exporterTaxId;
      if (form.importerTaxId) body.importerTaxId = form.importerTaxId;
      if (form.hsCode) body.hsCode = form.hsCode;
      if (form.shipmentId) body.shipmentId = form.shipmentId;
      if (form.issuedDate) body.issuedDate = form.issuedDate;
      if (form.expiryDate) body.expiryDate = form.expiryDate;
      if (form.notes) body.notes = form.notes;
      if (editId) await api.put(`/customs-documents/${editId}`, body);
      else await api.post("/customs-documents", body);
      setShowForm(false); setEditId(null); resetForm(); load();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (d: CustomsDocument) => {
    setForm({
      documentType: d.documentType, documentNumber: d.documentNumber, documentDate: d.documentDate.split("T")[0],
      exporterName: d.exporterName, exporterTaxId: d.exporterTaxId ?? "", importerName: d.importerName,
      importerTaxId: d.importerTaxId ?? "", goodsDescription: d.goodsDescription, goodsValue: String(d.goodsValue),
      currency: d.currency, hsCode: d.hsCode ?? "", countryOfOrigin: d.countryOfOrigin,
      destinationCountry: d.destinationCountry, shipmentId: d.shipmentId ?? "", issuedDate: d.issuedDate ? d.issuedDate.split("T")[0] : "",
      expiryDate: d.expiryDate ? d.expiryDate.split("T")[0] : "", notes: d.notes ?? "",
    });
    setEditId(d.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try { await api.delete(`/customs-documents/${id}`); load(); } catch (e) { console.error(e); }
  };

  const resetForm = () => setForm({ documentType: "DUA", documentNumber: "", documentDate: "", exporterName: "", exporterTaxId: "", importerName: "", importerTaxId: "", goodsDescription: "", goodsValue: "", currency: "USD", hsCode: "", countryOfOrigin: "Colombia", destinationCountry: "", shipmentId: "", issuedDate: "", expiryDate: "", notes: "" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Documentos Aduaneros</h1>
            <p className="text-muted-foreground">DUA, SAD y documentación de importación/exportación</p>
          </div>
          <Button onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> Nuevo Documento</Button>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar documento..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editId ? "Editar Documento" : "Nuevo Documento"}</h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.documentType} onValueChange={v => { if (v) setForm({ ...form, documentType: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DUA">DUA (Declaración Única Aduanera)</SelectItem>
                      <SelectItem value="SAD">SAD (Single Administrative Document)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Número *</Label><Input value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} /></div>
                <div><Label>Fecha *</Label><Input type="date" value={form.documentDate} onChange={e => setForm({ ...form, documentDate: e.target.value })} /></div>
                <div><Label>Exportador *</Label><Input value={form.exporterName} onChange={e => setForm({ ...form, exporterName: e.target.value })} /></div>
                <div><Label>NIT Exportador</Label><Input value={form.exporterTaxId} onChange={e => setForm({ ...form, exporterTaxId: e.target.value })} /></div>
                <div><Label>Importador *</Label><Input value={form.importerName} onChange={e => setForm({ ...form, importerName: e.target.value })} /></div>
                <div><Label>ID Fiscal Importador</Label><Input value={form.importerTaxId} onChange={e => setForm({ ...form, importerTaxId: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Descripción Mercancías *</Label><Input value={form.goodsDescription} onChange={e => setForm({ ...form, goodsDescription: e.target.value })} /></div>
                <div><Label>Valor (USD) *</Label><Input type="number" value={form.goodsValue} onChange={e => setForm({ ...form, goodsValue: e.target.value })} /></div>
                <div>
                  <Label>Moneda</Label>
                  <Select value={form.currency} onValueChange={v => { if (v) setForm({ ...form, currency: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "COP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Código HS</Label><Input value={form.hsCode} onChange={e => setForm({ ...form, hsCode: e.target.value })} /></div>
                <div><Label>País Origen</Label><Input value={form.countryOfOrigin} onChange={e => setForm({ ...form, countryOfOrigin: e.target.value })} /></div>
                <div><Label>País Destino</Label><Input value={form.destinationCountry} onChange={e => setForm({ ...form, destinationCountry: e.target.value })} /></div>
                <div><Label>Embarque ID</Label><Input value={form.shipmentId} onChange={e => setForm({ ...form, shipmentId: e.target.value })} placeholder="Opcional" /></div>
                <div><Label>Fecha Emisión</Label><Input type="date" value={form.issuedDate} onChange={e => setForm({ ...form, issuedDate: e.target.value })} /></div>
                <div><Label>Fecha Vencimiento</Label><Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editId ? "Actualizar" : "Crear"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? <p className="text-muted-foreground">Cargando...</p> : filtered.length === 0 ? <p className="text-muted-foreground">No se encontraron documentos</p> : (
          <div className="grid gap-4">
            {filtered.map(d => (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><FileCheck className="h-5 w-5" /></div>
                    <div>
                      <p className="font-medium">{typeLabels[d.documentType] || d.documentType} — {d.documentNumber}</p>
                      <p className="text-sm text-muted-foreground">{d.exporterName} → {d.importerName} • {d.goodsValue} {d.currency}</p>
                      {d.shipment && <p className="text-xs text-muted-foreground">Embarque: {d.shipment.shipmentNumber}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${d.status === "VALIDO" ? "bg-green-100 text-green-800" : d.status === "VENCIDO" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{d.status}</span>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(d)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id)}>Eliminar</Button>
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
