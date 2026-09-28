"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, X, Package, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface ShipmentOrder {
  order: { id: string; orderNumber: string; status: string };
}

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  containerType: string | null;
  containerNumber: string | null;
  mode: string | null;
  needsTempControl: boolean;
  departureDate: string | null;
  estimatedArrival: string | null;
  destination: { name: string; city: string; country: string } | null;
  provider: { name: string } | null;
  orders: ShipmentOrder[];
}

interface OrderOption {
  id: string;
  orderNumber: string;
  status: string;
  client?: { name: string };
}

interface DestOption {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface ProviderOption {
  id: string;
  name: string;
  type: string;
}

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador", CONSOLIDADO: "Consolidado", CONFIRMADO: "Confirmado",
  EN_TRANSITO: "En Tránsito", EN_ADUANA: "En Aduana", ENTREGADO: "Entregado", CANCELADO: "Cancelado",
};

const statusColors: Record<string, string> = {
  BORRADOR: "bg-gray-100 text-gray-800", CONSOLIDADO: "bg-blue-100 text-blue-800",
  CONFIRMADO: "bg-indigo-100 text-indigo-800", EN_TRANSITO: "bg-yellow-100 text-yellow-800",
  EN_ADUANA: "bg-orange-100 text-orange-800", ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [destinations, setDestinations] = useState<DestOption[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Shipment | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [form, setForm] = useState({
    destinationId: "", providerId: "", containerType: "", mode: "",
    needsTempControl: false, departureDate: "", estimatedArrival: "", notes: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const [s, o, d, p] = await Promise.all([
        api.get<Shipment[]>("/shipments"),
        api.get<OrderOption[]>("/orders?status=CONFIRMADO"),
        api.get<DestOption[]>("/shipping-destinations"),
        api.get<ProviderOption[]>("/logistics-providers"),
      ]);
      setShipments(s); setOrders(o); setDestinations(d); setProviders(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = shipments.filter(s =>
    s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      const body: Record<string, unknown> = {
        destinationId: form.destinationId,
        orderIds: selectedOrders,
      };
      if (form.providerId) body.providerId = form.providerId;
      if (form.containerType) body.containerType = form.containerType;
      if (form.mode) body.mode = form.mode;
      if (form.needsTempControl) body.needsTempControl = true;
      if (form.departureDate) body.departureDate = form.departureDate;
      if (form.estimatedArrival) body.estimatedArrival = form.estimatedArrival;
      if (form.notes) body.notes = form.notes;

      await api.post("/shipments", body);
      setShowForm(false); resetForm(); load();
    } catch (e) { console.error(e); }
  };

  const handleStatus = async (id: string, status: string) => {
    if (!confirm(`¿Cambiar estado a ${statusLabels[status]}?`)) return;
    try {
      await api.put(`/shipments/${id}/status`, { status });
      load();
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setForm({ destinationId: "", providerId: "", containerType: "", mode: "", needsTempControl: false, departureDate: "", estimatedArrival: "", notes: "" });
    setSelectedOrders([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Embarques</h1>
            <p className="text-muted-foreground">Consolidación, pooling y tracking de envíos</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Embarque
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar embarque..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Nuevo Embarque</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Destino *</Label>
                  <Select value={form.destinationId} onValueChange={v => setForm({ ...form, destinationId: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                    <SelectContent>
                      {destinations.map(d => <SelectItem key={d.id} value={d.id}>{d.name} - {d.city}, {d.country}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Proveedor</Label>
                  <Select value={form.providerId} onValueChange={v => setForm({ ...form, providerId: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                    <SelectContent>
                      {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contenedor</Label>
                  <Select value={form.containerType} onValueChange={v => setForm({ ...form, containerType: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["REFRIGERADO_20", "REFRIGERADO_40", "ESTANDAR_20", "ESTANDAR_40", "HC_40", "GRANELERO"].map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modo</Label>
                  <Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FTL">FTL (Full Truck Load)</SelectItem>
                      <SelectItem value="LCL">LCL (Less than Container)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.needsTempControl} onChange={e => setForm({ ...form, needsTempControl: e.target.checked })} className="h-4 w-4" />
                  <Label>Control de temperatura</Label>
                </div>
                <div><Label>Salida</Label><Input type="date" value={form.departureDate} onChange={e => setForm({ ...form, departureDate: e.target.value })} /></div>
                <div><Label>Llegada Estimada</Label><Input type="date" value={form.estimatedArrival} onChange={e => setForm({ ...form, estimatedArrival: e.target.value })} /></div>
              </div>

              <div className="mt-4">
                <Label>Pedidos (selecciona para consolidar)</Label>
                <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No hay pedidos confirmados disponibles</p>
                  ) : (
                    orders.map(o => (
                      <label key={o.id} className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer border-b last:border-b-0">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(o.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedOrders([...selectedOrders, o.id]);
                            else setSelectedOrders(selectedOrders.filter(id => id !== o.id));
                          }}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="text-sm font-medium">{o.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">Estado: {o.status} {o.client?.name && `• ${o.client.name}`}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{selectedOrders.length} pedidos seleccionados</p>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={selectedOrders.length === 0}>Crear Embarque</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showDetail && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{showDetail.shipmentNumber}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDetail(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Estado:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[showDetail.status]}`}>{statusLabels[showDetail.status]}</span></div>
                <div><span className="text-muted-foreground">Destino:</span> {showDetail.destination?.name ?? "—"}</div>
                <div><span className="text-muted-foreground">Proveedor:</span> {showDetail.provider?.name ?? "—"}</div>
                <div><span className="text-muted-foreground">Contenedor:</span> {showDetail.containerNumber ?? showDetail.containerType ?? "—"}</div>
                <div><span className="text-muted-foreground">Modo:</span> {showDetail.mode ?? "—"}</div>
                <div><span className="text-muted-foreground">Temperatura:</span> {showDetail.needsTempControl ? "Controlada" : "Ambiente"}</div>
                <div><span className="text-muted-foreground">Salida:</span> {showDetail.departureDate ? new Date(showDetail.departureDate).toLocaleDateString() : "—"}</div>
                <div><span className="text-muted-foreground">Llegada:</span> {showDetail.estimatedArrival ? new Date(showDetail.estimatedArrival).toLocaleDateString() : "—"}</div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Pedidos incluidos:</p>
                {showDetail.orders.map(so => (
                  <div key={so.order.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded mb-1">
                    <ChevronRight className="h-4 w-4" />
                    <span>{so.order.orderNumber}</span>
                    <span className="text-muted-foreground">• {so.order.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                {showDetail.status === "BORRADOR" && <Button size="sm" onClick={() => handleStatus(showDetail.id, "CONSOLIDADO")}>Consolidar</Button>}
                {showDetail.status === "CONSOLIDADO" && <Button size="sm" onClick={() => handleStatus(showDetail.id, "CONFIRMADO")}>Confirmar</Button>}
                {showDetail.status === "CONFIRMADO" && <Button size="sm" onClick={() => handleStatus(showDetail.id, "EN_TRANSITO")}>Marcar En Tránsito</Button>}
                {showDetail.status === "EN_TRANSITO" && <Button size="sm" onClick={() => handleStatus(showDetail.id, "EN_ADUANA")}>En Aduana</Button>}
                {showDetail.status === "EN_ADUANA" && <Button size="sm" onClick={() => handleStatus(showDetail.id, "ENTREGADO")}>Entregado</Button>}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? <p className="text-muted-foreground">Cargando...</p> : filtered.length === 0 ? <p className="text-muted-foreground">No se encontraron embarques</p> : (
          <div className="grid gap-4">
            {filtered.map(s => (
              <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setShowDetail(s)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{s.shipmentNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.destination?.name ?? "Sin destino"} • {s.orders.length} pedidos {s.provider && `• ${s.provider.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.status]}`}>{statusLabels[s.status]}</span>
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
