"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Leaf, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface EUDRDocument {
  id: string;
  documentNumber: string;
  documentDate: string;
  operatorName: string;
  operatorTaxId: string | null;
  productDescription: string;
  hsCode: string;
  countryCode: string;
  plotIdentification: string | null;
  plotGeolocationLat: number | null;
  plotGeolocationLng: number | null;
  harvestDate: string | null;
  harvestYear: number | null;
  deforestationEvidence: boolean;
  operatorDeclaration: string | null;
  supportingDocuments: string | null;
  shipmentId: string | null;
  status: string;
  issuedDate: string | null;
  expiryDate: string | null;
  notes: string | null;
  shipment?: { shipmentNumber: string } | null;
}

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800", VALIDO: "bg-green-100 text-green-800",
  RECHAZADO: "bg-red-100 text-red-800", VENCIDO: "bg-gray-100 text-gray-800",
};

export default function EUDRPage() {
  const [docs, setDocs] = useState<EUDRDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    documentNumber: "", documentDate: "", operatorName: "", operatorTaxId: "",
    productDescription: "", hsCode: "", countryCode: "CO", plotIdentification: "",
    plotGeolocationLat: "", plotGeolocationLng: "", harvestDate: "", harvestYear: "",
    deforestationEvidence: false, operatorDeclaration: "", supportingDocuments: "",
    shipmentId: "", issuedDate: "", expiryDate: "", notes: "",
  });

  const load = async () => {
    try { setLoading(true); setDocs(await api.get<EUDRDocument[]>("/eudr-documents")); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = docs.filter(d =>
    d.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.operatorName.toLowerCase().includes(search.toLowerCase()) ||
    d.productDescription.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      const body: Record<string, unknown> = {
        documentNumber: form.documentNumber, documentDate: form.documentDate,
        operatorName: form.operatorName, productDescription: form.productDescription,
        hsCode: form.hsCode, countryCode: form.countryCode, deforestationEvidence: form.deforestationEvidence,
      };
      if (form.operatorTaxId) body.operatorTaxId = form.operatorTaxId;
      if (form.plotIdentification) body.plotIdentification = form.plotIdentification;
      if (form.plotGeolocationLat) body.plotGeolocationLat = parseFloat(form.plotGeolocationLat);
      if (form.plotGeolocationLng) body.plotGeolocationLng = parseFloat(form.plotGeolocationLng);
      if (form.harvestDate) body.harvestDate = form.harvestDate;
      if (form.harvestYear) body.harvestYear = parseInt(form.harvestYear);
      if (form.operatorDeclaration) body.operatorDeclaration = form.operatorDeclaration;
      if (form.supportingDocuments) body.supportingDocuments = form.supportingDocuments;
      if (form.shipmentId) body.shipmentId = form.shipmentId;
      if (form.issuedDate) body.issuedDate = form.issuedDate;
      if (form.expiryDate) body.expiryDate = form.expiryDate;
      if (form.notes) body.notes = form.notes;
      if (editId) await api.put(`/eudr-documents/${editId}`, body);
      else await api.post("/eudr-documents", body);
      setShowForm(false); setEditId(null); resetForm(); load();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (d: EUDRDocument) => {
    setForm({
      documentNumber: d.documentNumber, documentDate: d.documentDate.split("T")[0],
      operatorName: d.operatorName, operatorTaxId: d.operatorTaxId ?? "",
      productDescription: d.productDescription, hsCode: d.hsCode, countryCode: d.countryCode,
      plotIdentification: d.plotIdentification ?? "", plotGeolocationLat: d.plotGeolocationLat != null ? String(d.plotGeolocationLat) : "",
      plotGeolocationLng: d.plotGeolocationLng != null ? String(d.plotGeolocationLng) : "",
      harvestDate: d.harvestDate ? d.harvestDate.split("T")[0] : "", harvestYear: d.harvestYear ? String(d.harvestYear) : "",
      deforestationEvidence: d.deforestationEvidence, operatorDeclaration: d.operatorDeclaration ?? "",
      supportingDocuments: d.supportingDocuments ?? "", shipmentId: d.shipmentId ?? "",
      issuedDate: d.issuedDate ? d.issuedDate.split("T")[0] : "", expiryDate: d.expiryDate ? d.expiryDate.split("T")[0] : "",
      notes: d.notes ?? "",
    });
    setEditId(d.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este documento EUDR?")) return;
    try { await api.delete(`/eudr-documents/${id}`); load(); } catch (e) { console.error(e); }
  };

  const resetForm = () => setForm({ documentNumber: "", documentDate: "", operatorName: "", operatorTaxId: "", productDescription: "", hsCode: "", countryCode: "CO", plotIdentification: "", plotGeolocationLat: "", plotGeolocationLng: "", harvestDate: "", harvestYear: "", deforestationEvidence: false, operatorDeclaration: "", supportingDocuments: "", shipmentId: "", issuedDate: "", expiryDate: "", notes: "" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Documentos EUDR</h1>
            <p className="text-muted-foreground">EU Deforestation Regulation — Due diligence y trazabilidad</p>
          </div>
          <Button onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> Nuevo Documento</Button>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar documento EUDR..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editId ? "Editar Documento EUDR" : "Nuevo Documento EUDR"}</h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Número Documento *</Label><Input value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })} /></div>
                <div><Label>Fecha *</Label><Input type="date" value={form.documentDate} onChange={e => setForm({ ...form, documentDate: e.target.value })} /></div>
                <div><Label>Operador *</Label><Input value={form.operatorName} onChange={e => setForm({ ...form, operatorName: e.target.value })} /></div>
                <div><Label>ID Fiscal Operador</Label><Input value={form.operatorTaxId} onChange={e => setForm({ ...form, operatorTaxId: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Descripción Producto *</Label><Input value={form.productDescription} onChange={e => setForm({ ...form, productDescription: e.target.value })} /></div>
                <div><Label>Código HS *</Label><Input value={form.hsCode} onChange={e => setForm({ ...form, hsCode: e.target.value })} /></div>
                <div>
                  <Label>País</Label>
                  <Select value={form.countryCode} onValueChange={v => { if (v) setForm({ ...form, countryCode: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["CO", "PE", "EC", "BR", "MX", "VN", "ID"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Identificación Parcela</Label><Input value={form.plotIdentification} onChange={e => setForm({ ...form, plotIdentification: e.target.value })} /></div>
                <div><Label>Latitud GPS</Label><Input type="number" step="any" value={form.plotGeolocationLat} onChange={e => setForm({ ...form, plotGeolocationLat: e.target.value })} /></div>
                <div><Label>Longitud GPS</Label><Input type="number" step="any" value={form.plotGeolocationLng} onChange={e => setForm({ ...form, plotGeolocationLng: e.target.value })} /></div>
                <div><Label>Fecha Cosecha</Label><Input type="date" value={form.harvestDate} onChange={e => setForm({ ...form, harvestDate: e.target.value })} /></div>
                <div><Label>Año Cosecha</Label><Input type="number" value={form.harvestYear} onChange={e => setForm({ ...form, harvestYear: e.target.value })} /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.deforestationEvidence} onChange={e => setForm({ ...form, deforestationEvidence: e.target.checked })} className="h-4 w-4" />
                  <Label>Evidencia de deforestación</Label>
                </div>
                <div className="md:col-span-2"><Label>Declaración del Operador</Label><Input value={form.operatorDeclaration} onChange={e => setForm({ ...form, operatorDeclaration: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Documentos Soporte</Label><Input value={form.supportingDocuments} onChange={e => setForm({ ...form, supportingDocuments: e.target.value })} placeholder="URLs o referencias" /></div>
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

        {loading ? <p className="text-muted-foreground">Cargando...</p> : filtered.length === 0 ? <p className="text-muted-foreground">No se encontraron documentos EUDR</p> : (
          <div className="grid gap-4">
            {filtered.map(d => (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">EUDR — {d.documentNumber}</p>
                      <p className="text-sm text-muted-foreground">{d.operatorName} • {d.productDescription} • {d.countryCode}</p>
                      <div className="flex gap-2 mt-1">
                        {d.harvestYear && <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Cosecha {d.harvestYear}</span>}
                        {d.plotGeolocationLat != null && d.plotGeolocationLng != null && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">GPS {d.plotGeolocationLat.toFixed(2)}°, {d.plotGeolocationLng.toFixed(2)}°</span>}
                        {d.deforestationEvidence && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Deforestación</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[d.status] || "bg-gray-100 text-gray-800"}`}>{d.status}</span>
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
