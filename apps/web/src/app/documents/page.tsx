"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Plus, Search, Download, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface Document {
  id: string;
  orderId: string;
  type: string;
  number: string;
  status: string;
  issuedBy: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  notes: string | null;
  createdAt: string;
  order?: { id: string; orderNumber: string; status: string };
  shipment?: { id: string; shipmentNumber: string; destination?: { name: string; country: string } | null } | null;
}

const typeLabels: Record<string, string> = {
  ORIGEN: "Cert. Origen",
  FITOSANITARIO: "Cert. Fitosanitario",
  EUDR: "EUDR",
  CALIDAD: "Cert. Calidad",
  COMERCIAL: "Doc. Comercial",
  PACKING_LIST: "Packing List",
};

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  GENERADO: "Generado",
  VALIDADO: "Validado",
  RECHAZADO: "Rechazado",
};

const statusColors: Record<string, string> = {
  BORRADOR: "bg-muted text-muted-foreground",
  GENERADO: "bg-primary/10 text-primary",
  VALIDADO: "bg-success/10 text-success",
  RECHAZADO: "bg-destructive/10 text-destructive",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    orderId: "",
    type: "ORIGEN",
    number: "",
    issuedBy: "",
    notes: "",
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const data = await api.get<Document[]>("/documents");
      setDocuments(data);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.orderId || !form.number) {
      alert("Pedido y número de documento son requeridos");
      return;
    }
    setCreating(true);
    try {
      await api.post("/documents", {
        orderId: form.orderId,
        type: form.type,
        number: form.number,
        issuedBy: form.issuedBy || undefined,
        notes: form.notes || undefined,
      });
      setShowCreate(false);
      setForm({ orderId: "", type: "ORIGEN", number: "", issuedBy: "", notes: "" });
      fetchDocuments();
    } catch (e: any) {
      alert(e?.message || "Error al crear documento");
    } finally {
      setCreating(false);
    }
  }

  async function handleDownloadPackingList(orderId: string, orderNumber: string) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/packing-list/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packing-list-${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Error al descargar packing list");
    }
  }

  async function handleDownloadStoredDocument(doc: Document) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/${doc.id}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("No se pudo descargar el documento");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Error al descargar el documento");
    }
  }

  const filtered = documents.filter((d) => {
    const matchSearch =
      !search ||
      d.number.toLowerCase().includes(search.toLowerCase()) ||
      d.order?.orderNumber?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || d.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-heading font-bold">Documentos de Exportación</h1>
              <p className="text-muted-foreground text-sm">Certificados de origen, fitosanitarios y más</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo Documento
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(typeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {showCreate && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <h3 className="font-medium">Nuevo Documento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>ID del Pedido</Label>
                  <Input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} placeholder="orderId" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Número</Label>
                  <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="Ej: CO-2026-001" />
                </div>
                <div>
                  <Label>Emitido por</Label>
                  <Input value={form.issuedBy} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })} placeholder="Entidad emisora" />
                </div>
                <div className="md:col-span-2">
                  <Label>Notas</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? "Creando..." : "Crear Documento"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando documentos...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay documentos {search ? "con esa búsqueda" : ""}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[doc.status] || ""}`}>
                          {statusLabels[doc.status] || doc.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {typeLabels[doc.type] || doc.type}
                        {doc.order?.orderNumber && ` · Pedido: ${doc.order.orderNumber}`}
                        {doc.shipment?.shipmentNumber && ` · Envío: ${doc.shipment.shipmentNumber}`}
                      </p>
                      {doc.issuedBy && (
                        <p className="text-xs text-muted-foreground/70 mt-1">Emitido por: {doc.issuedBy}</p>
                      )}
                      {doc.expiresAt && (
                        <p className="text-xs text-muted-foreground/70">
                          Vence: {new Date(doc.expiresAt).toLocaleDateString("es-CO")}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {doc.fileUrl && (
                        <Button size="sm" variant="outline" onClick={() => void handleDownloadStoredDocument(doc)} title="Descargar archivo guardado">
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      {doc.order && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadPackingList(doc.order!.id, doc.order!.orderNumber)} title="Descargar Packing List">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Link href={`/orders/${doc.order.id}`} className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold hover:bg-muted">
                            Pedido <ArrowRight size={13} />
                          </Link>
                        </>
                      )}
                    </div>
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
