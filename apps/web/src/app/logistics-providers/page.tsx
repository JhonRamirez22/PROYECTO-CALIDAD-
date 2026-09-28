"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Truck, Shield, Ship } from "lucide-react";
import { api } from "@/lib/api";

interface LogisticsProvider {
  id: string;
  name: string;
  type: string;
  taxId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  policyNumber: string | null;
  policyExpiry: string | null;
  insuredAmount: number | null;
  active: boolean;
  notes: string | null;
}

const typeLabels: Record<string, string> = {
  TRANSPORTISTA: "Transportista",
  ASEGURADORA: "Aseguradora",
  TRANSITARIO: "Transitario",
};

const typeColors: Record<string, string> = {
  TRANSPORTISTA: "bg-blue-100 text-blue-800",
  ASEGURADORA: "bg-green-100 text-green-800",
  TRANSITARIO: "bg-purple-100 text-purple-800",
};

export default function LogisticsProvidersPage() {
  const [providers, setProviders] = useState<LogisticsProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "TRANSPORTISTA",
    taxId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    policyNumber: "",
    policyExpiry: "",
    insuredAmount: "",
    notes: "",
  });

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await api.get<LogisticsProvider[]>("/logistics-providers");
      setProviders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProviders(); }, []);

  const filtered = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      const body = {
        ...form,
        taxId: form.taxId || undefined,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        policyNumber: form.policyNumber || undefined,
        policyExpiry: form.policyExpiry || undefined,
        insuredAmount: form.insuredAmount ? parseFloat(form.insuredAmount) : undefined,
        notes: form.notes || undefined,
      };
      if (editId) {
        await api.put(`/logistics-providers/${editId}`, body);
      } else {
        await api.post("/logistics-providers", body);
      }
      setShowForm(false);
      setEditId(null);
      resetForm();
      loadProviders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (p: LogisticsProvider) => {
    setForm({
      name: p.name,
      type: p.type,
      taxId: p.taxId ?? "",
      contactName: p.contactName ?? "",
      contactEmail: p.contactEmail ?? "",
      contactPhone: p.contactPhone ?? "",
      policyNumber: p.policyNumber ?? "",
      policyExpiry: p.policyExpiry ? p.policyExpiry.split("T")[0] : "",
      insuredAmount: p.insuredAmount ? String(p.insuredAmount) : "",
      notes: p.notes ?? "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    try {
      await api.delete(`/logistics-providers/${id}`);
      loadProviders();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setForm({ name: "", type: "TRANSPORTISTA", taxId: "", contactName: "", contactEmail: "", contactPhone: "", policyNumber: "", policyExpiry: "", insuredAmount: "", notes: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Proveedores de Logística</h1>
            <p className="text-muted-foreground">Transportistas, aseguradoras y transitarios</p>
          </div>
          <Button onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Proveedor
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editId ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={v => { if (v) setForm({ ...form, type: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSPORTISTA">Transportista</SelectItem>
                      <SelectItem value="ASEGURADORA">Aseguradora</SelectItem>
                      <SelectItem value="TRANSITARIO">Transitario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>NIT/RUC</Label><Input value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} /></div>
                <div><Label>Contacto</Label><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
                <div><Label>Teléfono</Label><Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} /></div>
                <div><Label>Nº Póliza</Label><Input value={form.policyNumber} onChange={e => setForm({ ...form, policyNumber: e.target.value })} /></div>
                <div><Label>Vencimiento Póliza</Label><Input type="date" value={form.policyExpiry} onChange={e => setForm({ ...form, policyExpiry: e.target.value })} /></div>
                <div><Label>Monto Asegurado (USD)</Label><Input type="number" value={form.insuredAmount} onChange={e => setForm({ ...form, insuredAmount: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editId ? "Actualizar" : "Crear"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No se encontraron proveedores</p>
        ) : (
          <div className="grid gap-4">
            {filtered.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {p.type === "TRANSPORTISTA" ? <Truck className="h-5 w-5" /> : p.type === "ASEGURADORA" ? <Shield className="h-5 w-5" /> : <Ship className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[p.type] || ""}`}>{typeLabels[p.type] || p.type}</span>
                        {p.contactName && <span>• {p.contactName}</span>}
                        {p.contactEmail && <span>• {p.contactEmail}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${p.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{p.active ? "Activo" : "Inactivo"}</span>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Eliminar</Button>
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
