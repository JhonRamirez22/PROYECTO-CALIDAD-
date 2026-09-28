"use client";

import { FormEvent, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Truck,
  PackageCheck,
  FileText,
  FileDown,
  Ban,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface OrderItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  packageCount?: number | null;
  grossWeight?: string | number | null;
  dimensions?: string | null;
  marks?: string | null;
  product: { id: string; name: string; variety?: string };
  lot?: { id: string; traceabilityCode: string; status: string };
}
type LotOption = { id: string; productId: string; traceabilityCode: string; weight: string | number; status: string };

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  incoterm: string;
  rejectReason: string | null;
  currency: string;
  totalAmount: string | null;
  notes: string | null;
  invoices?: { id: string; invoiceNumber: string; type: string; validUntil: string | null; createdAt: string }[];
  documents?: { id: string; number: string; type: string; status: string; createdAt: string; fileUrl: string | null }[];
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    company: string;
    contactName: string | null;
    country: string | null;
    email: string | null;
  };
  seller: { id: string; email: string } | null;
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente Aprobación",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const statusColors: Record<string, string> = {
  BORRADOR: "bg-muted text-muted-foreground border-l-muted-foreground",
  PENDIENTE_APROBACION: "bg-warning/10 text-warning border-l-warning",
  CONFIRMADO: "bg-success/10 text-success border-l-success",
  RECHAZADO: "bg-destructive/10 text-destructive border-l-destructive",
  ENVIADO: "bg-primary/10 text-primary border-l-primary",
  ENTREGADO: "bg-success/10 text-success border-l-success",
  CANCELADO: "bg-muted text-muted-foreground border-l-muted-foreground",
};

const paymentLabels: Record<string, string> = {
  PENDIENTE: "Sin pago",
  PROCESANDO: "Procesando",
  COMPLETADO: "Pagado",
  FALLIDO: "Pago fallido",
  REEMBOLSADO: "Reembolsado",
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [proformaValidUntil, setProformaValidUntil] = useState("");
  const [proformaLoading, setProformaLoading] = useState(false);
  const [proformaEmailState, setProformaEmailState] = useState("");
  const [actionError, setActionError] = useState("");
  const [availableLots, setAvailableLots] = useState<LotOption[]>([]);
  const [packingEditId, setPackingEditId] = useState("");
  const [packingForm, setPackingForm] = useState({ packageCount: "", grossWeight: "", dimensions: "", marks: "" });

  useEffect(() => {
    fetchOrder();
    api.get<LotOption[]>("/lots?status=DISPONIBLE").then(setAvailableLots).catch(() => setAvailableLots([]));
  }, [id]);

  const fetchOrder = async () => {
    try {
      setOrder(await api.get<Order>(`/orders/${id}`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    action: "submit" | "approve" | "reject" | "cancel" | "ship" | "deliver"
  ) => {
    setActionLoading(true);
    setActionError("");
    try {
      if (action === "submit") {
        await api.put(`/orders/${id}/submit`, {});
      } else if (action === "approve") {
        await api.put(`/orders/${id}/approve`, {});
      } else if (action === "reject") {
        await api.put(`/orders/${id}/reject`, { reason: rejectReason });
        setShowRejectDialog(false);
      } else if (action === "cancel") {
        await api.put(`/orders/${id}/cancel`, {});
      } else if (action === "ship") {
        await api.put(`/orders/${id}/ship`, {});
      } else if (action === "deliver") {
        await api.put(`/orders/${id}/deliver`, {});
      }
      await fetchOrder();
    } catch (e: any) {
      setActionError(e?.message || "Error al realizar la acción");
      await fetchOrder();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadProforma = async () => {
    if (!proformaValidUntil) {
      setActionError("Selecciona la fecha de validez de la proforma.");
      return;
    }
    setProformaLoading(true);
    setActionError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/proforma/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ validUntil: proformaValidUntil }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "No se pudo generar la proforma.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `proforma-${order?.orderNumber ?? id}.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      await fetchOrder();
    } catch (downloadError) {
      setActionError(downloadError instanceof Error ? downloadError.message : "No se pudo generar la proforma.");
    } finally {
      setProformaLoading(false);
    }
  };

  const handleDownloadSavedDocument = async (documentId: string, fileName: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/${documentId}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("No se pudo descargar el documento guardado.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setActionError(downloadError instanceof Error ? downloadError.message : "No se pudo descargar el documento.");
    }
  };

  const handleEmailProforma = async () => {
    if (!proformaValidUntil) {
      setActionError("Selecciona la fecha de validez de la proforma.");
      return;
    }
    setProformaLoading(true);
    setActionError("");
    setProformaEmailState("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/proforma/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ validUntil: proformaValidUntil }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message ?? "No se pudo enviar la proforma.");
      setProformaEmailState(payload.message);
      await fetchOrder();
    } catch (emailError) {
      setActionError(emailError instanceof Error ? emailError.message : "No se pudo enviar la proforma.");
    } finally {
      setProformaLoading(false);
    }
  };

  const handleDownloadPackingList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/packing-list/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `packing-list-${order?.orderNumber || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Error al descargar packing list");
    }
  };

  const changeLot = async (itemId: string, lotId: string) => {
    setActionLoading(true);
    setActionError("");
    try {
      setOrder(await api.put<Order>(`/orders/${id}/items/${itemId}/lot`, { lotId }));
      setAvailableLots(await api.get<LotOption[]>("/lots?status=DISPONIBLE"));
    } catch (changeError) {
      setActionError(changeError instanceof Error ? changeError.message : "No se pudo cambiar el lote.");
    } finally {
      setActionLoading(false);
    }
  };

  const openPackingEditor = (item: OrderItem) => {
    setPackingEditId(item.id);
    setPackingForm({ packageCount: String(item.packageCount ?? ""), grossWeight: String(item.grossWeight ?? ""), dimensions: item.dimensions ?? "", marks: item.marks ?? "" });
  };

  const savePackingDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!packingEditId) return;
    setActionLoading(true);
    setActionError("");
    try {
      setOrder(await api.put<Order>(`/orders/${id}/items/${packingEditId}/packing`, {
        packageCount: Number(packingForm.packageCount),
        grossWeight: Number(packingForm.grossWeight),
        dimensions: packingForm.dimensions,
        marks: packingForm.marks || undefined,
      }));
      setPackingEditId("");
    } catch (packingError) {
      setActionError(packingError instanceof Error ? packingError.message : "No se pudieron guardar los datos de embalaje.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Cargando pedido...</p>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <p className="text-destructive">Pedido no encontrado</p>
      </DashboardLayout>
    );
  }

  const total = order.items.reduce(
    (sum, i) => sum + parseFloat(i.quantity) * parseFloat(i.unitPrice),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-heading font-bold">
                  {order.orderNumber}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Creado:{" "}
                  {new Date(order.createdAt).toLocaleDateString("es-CO")}
                </p>
              </div>
            </div>
          </div>
          <Badge
            className={`border-l-2 ${statusColors[order.status] || ""}`}
          >
            {order.status === "BORRADOR" && order.rejectReason ? "Devuelto a borrador" : statusLabels[order.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-semibold mb-4">
                  Información del Cliente
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Empresa:</span>
                    <p className="font-medium">
                      {order.client.company || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contacto:</span>
                    <p className="font-medium">
                      {order.client.contactName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">País:</span>
                    <p className="font-medium">
                      {order.client.country || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">
                      {order.client.email || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-semibold mb-4">
                  Detalle de Productos
                </h2>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {item.product.name}
                          {item.product.variety && (
                            <span className="text-muted-foreground ml-2">
                              ({item.product.variety})
                            </span>
                          )}
                        </p>
                        {item.lot && (
                          <p className="text-xs text-muted-foreground">
                            Lote: {item.lot.traceabilityCode} · Estado:{" "}
                            {item.lot.status}
                          </p>
                        )}
                        {(order.status === "BORRADOR" || order.status === "PENDIENTE_APROBACION") && (user?.roles?.includes("ADMIN") || user?.roles?.includes("OPERADOR") || user?.roles?.includes("VENDEDOR")) && (
                          <label className="mt-2 block max-w-[260px] text-[10px] font-medium text-muted-foreground">
                            Cambiar lote antes de aprobar
                            <select value={item.lot?.id ?? ""} onChange={(event) => void changeLot(item.id, event.target.value)} disabled={actionLoading} className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground">
                              {!item.lot && <option value="">Seleccionar lote</option>}
                              {item.lot && <option value={item.lot.id}>{item.lot.traceabilityCode} · actual</option>}
                              {availableLots.filter((lot) => lot.productId === item.product.id && lot.id !== item.lot?.id).map((lot) => <option key={lot.id} value={lot.id}>{lot.traceabilityCode} · {Number(lot.weight).toLocaleString("es-CO")} kg disponibles</option>)}
                            </select>
                          </label>
                        )}
                        {(item.packageCount || item.dimensions || item.grossWeight) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.packageCount ?? "—"} bultos · bruto {item.grossWeight ?? "pendiente"} kg · {item.dimensions ?? "dimensiones pendientes"}
                          </p>
                        )}
                        {(["BORRADOR", "PENDIENTE_APROBACION", "CONFIRMADO"].includes(order.status)) && (user?.roles?.includes("ADMIN") || user?.roles?.includes("OPERADOR") || user?.roles?.includes("VENDEDOR")) && (
                          <div className="mt-2">
                            {packingEditId === item.id ? <form onSubmit={savePackingDetails} className="grid max-w-[440px] grid-cols-2 gap-2 rounded-lg border border-border bg-card p-3">
                              <Input aria-label="Número de bultos" type="number" min="1" value={packingForm.packageCount} onChange={(event) => setPackingForm({ ...packingForm, packageCount: event.target.value })} required />
                              <Input aria-label="Peso bruto en kilogramos" type="number" min={item.quantity} step="0.01" value={packingForm.grossWeight} onChange={(event) => setPackingForm({ ...packingForm, grossWeight: event.target.value })} required />
                              <Input aria-label="Dimensiones por bulto" placeholder="Dimensiones" value={packingForm.dimensions} onChange={(event) => setPackingForm({ ...packingForm, dimensions: event.target.value })} required />
                              <Input aria-label="Marcas de embalaje" placeholder="Marcas opcionales" value={packingForm.marks} onChange={(event) => setPackingForm({ ...packingForm, marks: event.target.value })} />
                              <div className="col-span-2 flex gap-2"><Button type="submit" size="sm" disabled={actionLoading}>Guardar embalaje</Button><Button type="button" variant="ghost" size="sm" onClick={() => setPackingEditId("")}>Cancelar</Button></div>
                            </form> : <button type="button" onClick={() => openPackingEditor(item)} className="text-[10px] font-semibold text-primary hover:underline">Editar datos de embalaje</button>}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {parseFloat(item.quantity).toLocaleString("es-CO")} kg
                          × {order.currency}{" "}
                          {parseFloat(item.unitPrice).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.currency}{" "}
                          {(
                            parseFloat(item.quantity) *
                            parseFloat(item.unitPrice)
                          ).toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <div className="text-right">
                    <span className="text-muted-foreground text-sm">
                      Total:
                    </span>
                    <p className="text-xl font-heading font-bold">
                      {order.currency}{" "}
                      {total.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-heading font-semibold mb-2">Notas</h2>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {order.rejectReason && (
              <Card className="border-destructive/50">
                <CardContent className="p-6">
                  <h2 className="font-heading font-semibold text-destructive mb-2">
                    Motivo de Rechazo
                  </h2>
                  <p className="text-sm">{order.rejectReason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading font-semibold mb-4">
                  Detalles del Pedido
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Incoterm:</span>
                    <span className="font-medium">{order.incoterm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moneda:</span>
                    <span className="font-medium">{order.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pago:</span>
                    <span className="font-medium">
                      {paymentLabels[order.paymentStatus] || "Sin pago"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Última actualización:
                    </span>
                    <span className="font-medium">
                      {new Date(order.updatedAt).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                  {order.seller && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendedor:</span>
                      <span className="font-medium">{order.seller.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-heading font-semibold mb-2">Acciones</h2>
                {actionError && <p role="alert" className="rounded-md bg-destructive/5 p-3 text-xs text-destructive">{actionError}</p>}

                {order.status === "BORRADOR" && (user?.roles?.includes("ADMIN") || user?.roles?.includes("OPERADOR") || user?.roles?.includes("VENDEDOR")) && (
                  <Button className="w-full" onClick={() => void handleAction("submit")} disabled={actionLoading}>
                    {actionLoading ? "Enviando…" : "Enviar a aprobación"}
                  </Button>
                )}

                {order.status === "PENDIENTE_APROBACION" && (user?.roles?.includes("ADMIN") || user?.roles?.includes("GERENTE")) && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => handleAction("approve")}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar Pedido
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar Pedido
                    </Button>
                  </>
                )}

                {order.status === "CONFIRMADO" && (
                  <Button
                    className="w-full"
                    onClick={() => handleAction("ship")}
                    disabled={actionLoading}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Marcar como Enviado
                  </Button>
                )}

                {order.status === "ENVIADO" && (
                  <Button
                    className="w-full"
                    onClick={() => handleAction("deliver")}
                    disabled={actionLoading}
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Marcar como Entregado
                  </Button>
                )}

                {!["ENTREGADO", "CANCELADO", "RECHAZADO"].includes(
                  order.status
                ) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction("cancel")}
                    disabled={actionLoading}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancelar Pedido
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadPackingList}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Descargar Packing List
                </Button>
                <div className="space-y-2 border-t border-border pt-3">
                  <label htmlFor="proforma-valid-until" className="block text-xs font-medium">Validez de la proforma</label>
                  <input id="proforma-valid-until" type="date" min={new Date().toISOString().slice(0, 10)} value={proformaValidUntil} onChange={(event) => setProformaValidUntil(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
                  <Button type="button" variant="outline" className="w-full" onClick={() => void handleDownloadProforma()} disabled={proformaLoading}>
                    <FileDown className="mr-2 h-4 w-4" />{proformaLoading ? "Generando…" : "Generar proforma PDF"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => void handleEmailProforma()} disabled={proformaLoading || !order.client.email}>
                    {order.client.email ? "Enviar proforma al cliente" : "Registra un correo para enviar"}
                  </Button>
                  {proformaEmailState && <p role="status" className="text-xs text-muted-foreground">{proformaEmailState}</p>}
                {order.invoices?.some((invoice) => invoice.type === "PROFORMA") && (
                  <div className="border-t border-border pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Proforma registrada</p>
                    {order.invoices.filter((invoice) => invoice.type === "PROFORMA").map((invoice) => <p key={invoice.id} className="mt-2 flex justify-between gap-2 text-xs"><span className="font-mono">{invoice.invoiceNumber}</span><span className="text-muted-foreground">Válida hasta {invoice.validUntil ? new Date(invoice.validUntil).toLocaleDateString("es-CO") : "—"}</span></p>)}
                  </div>
                )}
                {order.documents?.some((document) => document.type === "PACKING_LIST") && (
                  <div className="border-t border-border pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Packing list · historial</p>
                    {order.documents.filter((document) => document.type === "PACKING_LIST").map((document) => (
                      <div key={document.id} className="mt-2 flex items-center justify-between gap-3 text-xs">
                        <span className="font-mono">{document.number}</span>
                        <button type="button" onClick={() => void handleDownloadSavedDocument(document.id, document.number)} className="font-semibold text-primary hover:underline">Descargar</button>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showRejectDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-xl p-6 w-full max-w-md ring-1 ring-foreground/10 shadow-lg">
              <h2 className="font-heading text-lg font-semibold mb-2">
                Rechazar Pedido
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Ingrese el motivo del rechazo
              </p>
              <textarea
                className="w-full p-3 border rounded-md bg-background text-sm min-h-[100px]"
                placeholder="Motivo del rechazo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2 mt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleAction("reject")}
                  disabled={actionLoading || !rejectReason.trim()}
                >
                  {actionLoading ? "Procesando..." : "Rechazar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectReason("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
