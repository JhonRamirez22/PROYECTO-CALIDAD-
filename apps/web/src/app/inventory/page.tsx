"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface InventoryLot {
  id: string;
  traceabilityCode: string;
  status: string;
  weight: number;
  harvestDate: string | null;
  originLocation: string | null;
  certificatesCount: number;
}

interface InventoryRow {
  productId: string;
  productName: string;
  productType: string;
  variety: string;
  origin: string;
  process: string | null;
  totalWeight: number;
  disponibleWeight: number;
  reservadoWeight: number;
  enviadoWeight: number;
  certificadoWeight: number;
  lotsCount: number;
  certificatesCount: number;
  lots: InventoryLot[];
}

const statusLabels: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  ENVIADO: "Enviado",
  CERTIFICADO: "Certificado",
};

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [harvestFrom, setHarvestFrom] = useState("");
  const [harvestTo, setHarvestTo] = useState("");

  const fetchInventory = useCallback(async () => {
    try { setRows(await api.get<InventoryRow[]>("/lots/inventory")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void fetchInventory();
    const timer = window.setInterval(() => void fetchInventory(), 20_000);
    window.addEventListener("focus", fetchInventory);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", fetchInventory); };
  }, [fetchInventory]);

  const filtered = useMemo(() => rows.map((row) => {
    const lots = row.lots.filter((lot) => {
      const statusMatch = filterStatus === "ALL" || lot.status === filterStatus;
      const date = lot.harvestDate ? new Date(lot.harvestDate).toISOString().slice(0, 10) : "";
      const startMatch = !harvestFrom || (date && date >= harvestFrom);
      const endMatch = !harvestTo || (date && date <= harvestTo);
      return statusMatch && startMatch && endMatch;
    });
    const totalWeight = lots.reduce((sum, lot) => sum + lot.weight, 0);
    const sumStatus = (status: string) => lots.filter((lot) => lot.status === status).reduce((sum, lot) => sum + lot.weight, 0);
    return { ...row, lots, totalWeight, lotsCount: lots.length, disponibleWeight: sumStatus("DISPONIBLE"), reservadoWeight: sumStatus("RESERVADO"), enviadoWeight: sumStatus("ENVIADO"), certificadoWeight: sumStatus("CERTIFICADO") };
  }).filter((row) => {
    const q = search.toLowerCase();
    const matchSearch = `${row.productName} ${row.variety} ${row.origin}`.toLowerCase().includes(q);
    const matchType = filterType === "all" || row.productType === filterType;
    return matchSearch && matchType && row.lots.length > 0;
  }), [rows, filterStatus, harvestFrom, harvestTo, search, filterType]);

  const exportCsv = () => {
    const lines = ["Producto,Lote,Estado,Peso kg,Origen,Fecha cosecha"];
    filtered.forEach((row) => row.lots.forEach((lot) => lines.push([
      row.productName, lot.traceabilityCode, statusLabels[lot.status] ?? lot.status, lot.weight, lot.originLocation ?? row.origin, lot.harvestDate ?? "",
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "inventario-ritech.csv"; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-[26px] font-semibold tracking-[-0.045em] sm:text-[32px]">Inventario</h1><p className="text-sm text-muted-foreground">Existencias agregadas por producto y lote · actualización automática cada 20 s</p></div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={exportCsv}><Download size={14} className="mr-2"/>CSV</Button><Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} className="mr-2"/>Imprimir / PDF</Button></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Café y Cacao</SelectItem>
              <SelectItem value="CAFE">Café</SelectItem>
              <SelectItem value="CACAO">Cacao</SelectItem>
            </SelectContent>
          </Select>
          <select aria-label="Filtrar por estado del lote" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-xs"><option value="ALL">Todos los estados</option><option value="DISPONIBLE">Disponible</option><option value="RESERVADO">Reservado</option><option value="ENVIADO">Enviado</option><option value="CERTIFICADO">Certificado</option></select>
          <Input aria-label="Cosecha desde" type="date" value={harvestFrom} onChange={(e) => setHarvestFrom(e.target.value)} className="h-10 w-auto text-xs" />
          <Input aria-label="Cosecha hasta" type="date" value={harvestTo} onChange={(e) => setHarvestTo(e.target.value)} className="h-10 w-auto text-xs" />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Calculando inventario...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No hay inventario registrado</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {filtered.map((r) => (
              <Card key={r.productId}>
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">{r.productName}</h2>
                      <p className="text-sm text-muted-foreground">{r.variety} · {r.origin}{r.process ? ` · ${r.process}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-heading font-bold text-primary">{r.totalWeight.toLocaleString("es-CO")} kg</p>
                      <p className="text-xs text-muted-foreground">{r.lotsCount} lote(s) · {r.certificatesCount} certificado(s)</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                      {r.totalWeight > 0 && (
                        <>
                          <div className="bg-success h-full" style={{ width: `${(r.disponibleWeight / r.totalWeight) * 100}%` }} title="Disponible" />
                          <div className="bg-warning h-full" style={{ width: `${(r.reservadoWeight / r.totalWeight) * 100}%` }} title="Reservado" />
                          <div className="bg-primary h-full" style={{ width: `${(r.enviadoWeight / r.totalWeight) * 100}%` }} title="Enviado" />
                          <div className="bg-accent h-full" style={{ width: `${(r.certificadoWeight / r.totalWeight) * 100}%` }} title="Certificado" />
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span><span className="inline-block h-2 w-2 rounded-full bg-success mr-1.5" />Disponible: {r.disponibleWeight.toLocaleString("es-CO")} kg</span>
                      <span><span className="inline-block h-2 w-2 rounded-full bg-warning mr-1.5" />Reservado: {r.reservadoWeight.toLocaleString("es-CO")} kg</span>
                      <span><span className="inline-block h-2 w-2 rounded-full bg-primary mr-1.5" />Enviado: {r.enviadoWeight.toLocaleString("es-CO")} kg</span>
                      {r.certificadoWeight > 0 && <span>Certificado: {r.certificadoWeight.toLocaleString("es-CO")} kg</span>}
                      <span>Disponibilidad: {r.totalWeight > 0 ? Math.round((r.disponibleWeight / r.totalWeight) * 100) : 0}%</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="pb-2 pr-4 font-medium">Lote</th>
                          <th className="pb-2 pr-4 font-medium">Estado</th>
                          <th className="pb-2 pr-4 font-medium text-right">Peso (kg)</th>
                          <th className="pb-2 pr-4 font-medium">Origen</th>
                          <th className="pb-2 font-medium text-right">Certificados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.lots.map((l) => (
                          <tr key={l.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-mono text-xs text-primary">{l.traceabilityCode}</td>
                            <td className="py-2 pr-4">{statusLabels[l.status]}</td>
                            <td className="py-2 pr-4 text-right">{l.weight.toLocaleString("es-CO")}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{l.originLocation ?? "—"}</td>
                            <td className="py-2 text-right">{l.certificatesCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
