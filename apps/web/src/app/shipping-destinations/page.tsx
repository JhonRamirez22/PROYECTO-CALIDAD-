"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, MapPin } from "lucide-react";
import { api } from "@/lib/api";

interface ShippingDestination {
  id: string;
  name: string;
  city: string;
  country: string;
  portCode: string | null;
  address: string | null;
  requiresTempControl: boolean;
  tempMinC: number | null;
  tempMaxC: number | null;
  defaultContainer: string | null;
  defaultMode: string | null;
  incotermDefault: string | null;
  active: boolean;
  notes: string | null;
}

const containerLabels: Record<string, string> = {
  REFRIGERADO_20: "Refrigerado 20'",
  REFRIGERADO_40: "Refrigerado 40'",
  ESTANDAR_20: "Estándar 20'",
  ESTANDAR_40: "Estándar 40'",
  HC_40: "HC 40'",
  GRANELERO: "Granelero",
};

export default function ShippingDestinationsPage() {
  const [destinations, setDestinations] = useState<ShippingDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", city: "", country: "", portCode: "", address: "",
    requiresTempControl: false, tempMinC: "", tempMaxC: "",
    defaultContainer: "", defaultMode: "", incotermDefault: "", notes: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.get<ShippingDestination[]>("/shipping-destinations");
      setDestinations(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = destinations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.city.toLowerCase().includes(search.toLowerCase()) ||
    d.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      const body: Record<string, unknown> = { name: form.name, city: form.city, country: form.country };
      if (form.portCode) body.portCode = form.portCode;
      if (form.address) body.address = form.address;
      if (form.requiresTempControl) {
        body.requiresTempControl = true;
        if (form.tempMinC) body.tempMinC = parseFloat(form.tempMinC);
        if (form.tempMaxC) body.tempMaxC = parseFloat(form.tempMaxC);
      }
      if (form.defaultContainer) body.defaultContainer = form.defaultContainer;
      if (form.defaultMode) body.defaultMode = form.defaultMode;
      if (form.incotermDefault) body.incotermDefault = form.incotermDefault;
      if (form.notes) body.notes = form.notes;

      if (editId) {
        await api.put(`/shipping-destinations/${editId}`, body);
      } else {
        await api.post("/shipping-destinations", body);
      }
      setShowForm(false); setEditId(null); resetForm(); load();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (d: ShippingDestination) => {
    setForm({
      name: d.name, city: d.city, country: d.country, portCode: d.portCode ?? "",
      address: d.address ?? "", requiresTempControl: d.requiresTempControl,
      tempMinC: d.tempMinC != null ? String(d.tempMinC) : "", tempMaxC: d.tempMaxC != null ? String(d.tempMaxC) : "",
      defaultContainer: d.defaultContainer ?? "", defaultMode: d.defaultMode ?? "",
      incotermDefault: d.incotermDefault ?? "", notes: d.notes ?? "",
    });
    setEditId(d.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este destino?")) return;
    try { await api.delete(`/shipping-destinations/${id}`); load(); } catch (e) { console.error(e); }
  };

  const resetForm = () => setForm({ name: "", city: "", country: "", portCode: "", address: "", requiresTempControl: false, tempMinC: "", tempMaxC: "", defaultContainer: "", defaultMode: "", incotermDefault: "", notes: "" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Destinos de Envío</h1>
            <p className="text-muted-foreground">Puertos y destinos en la Unión Europea</p>
          </div>
          <Button onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Destino
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar destino..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editId ? "Editar Destino" : "Nuevo Destino"}</h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Ciudad *</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>País *</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
                <div><Label>Código Puerto</Label><Input value={form.portCode} onChange={e => setForm({ ...form, portCode: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.requiresTempControl} onChange={e => setForm({ ...form, requiresTempControl: e.target.checked })} className="h-4 w-4" />
                  <Label>Control de temperatura</Label>
                </div>
                {form.requiresTempControl && (
                  <>
                    <div><Label>Temp Mín (°C)</Label><Input type="number" value={form.tempMinC} onChange={e => setForm({ ...form, tempMinC: e.target.value })} /></div>
                    <div><Label>Temp Máx (°C)</Label><Input type="number" value={form.tempMaxC} onChange={e => setForm({ ...form, tempMaxC: e.target.value })} /></div>
                  </>
                )}
                <div>
                  <Label>Contenedor Default</Label>
                  <Select value={form.defaultContainer} onValueChange={v => setForm({ ...form, defaultContainer: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(containerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modo Default</Label>
                  <Select value={form.defaultMode} onValueChange={v => setForm({ ...form, defaultMode: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FTL">FTL (Full Truck Load)</SelectItem>
                      <SelectItem value="LCL">LCL (Less than Container Load)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Incoterm Default</Label>
                  <Select value={form.incotermDefault} onValueChange={v => setForm({ ...form, incotermDefault: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["FOB", "CFR", "CIF", "EXW", "FCA", "CPT", "CIP", "DAP", "DDP", "DPU"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editId ? "Actualizar" : "Crear"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? <p className="text-muted-foreground">Cargando...</p> : filtered.length === 0 ? <p className="text-muted-foreground">No se encontraron destinos</p> : (
          <div className="grid gap-4">
            {filtered.map(d => (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-sm text-muted-foreground">{d.city}, {d.country} {d.portCode && `• Puerto: ${d.portCode}`}</p>
                      <div className="flex gap-2 mt-1">
                        {d.requiresTempControl && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">Refrigerado {d.tempMinC}°C - {d.tempMaxC}°C</span>}
                        {d.defaultContainer && <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{containerLabels[d.defaultContainer] || d.defaultContainer}</span>}
                        {d.incotermDefault && <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{d.incotermDefault}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${d.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{d.active ? "Activo" : "Inactivo"}</span>
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
