"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import { api } from "@/lib/api";

interface CartItem {
  id: string;
  productId: string;
  lotId: string | null;
  quantity: number;
  unitPrice: number;
  currency: string;
  product: { id: string; name: string; type: string; variety?: string; origin?: string };
  lot?: { id: string; traceabilityCode: string; weight: number };
}

interface CartResponse {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  currency: string;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cartSession") || crypto.randomUUID();
    }
    return "default";
  });

  useEffect(() => {
    localStorage.setItem("cartSession", sessionId);
    fetchCart();
  }, [sessionId]);

  async function fetchCart() {
    setLoading(true);
    try {
      const data = await api.get<CartResponse>(`/cart/${sessionId}`);
      setCart(data);
    } catch {
      setCart({ items: [], itemCount: 0, subtotal: 0, currency: "EUR" });
    } finally {
      setLoading(false);
    }
  }

  async function updateQty(itemId: string, newQty: number) {
    if (newQty < 1) return;
    try {
      await api.put(`/cart/${itemId}/quantity`, { quantity: newQty });
      fetchCart();
    } catch (e: any) {
      alert(e?.message || "Error al actualizar cantidad");
    }
  }

  async function removeItem(itemId: string) {
    try {
      await api.delete(`/cart/${itemId}`);
      fetchCart();
    } catch {}
  }

  async function clearCart() {
    if (!confirm("Vaciar carrito completely?")) return;
    try {
      await api.delete(`/cart/session/${sessionId}`);
      fetchCart();
    } catch {}
  }

  const fmt = (n: number, cur: string) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: cur }).format(n);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-heading font-bold">Carrito de Exportación</h1>
              <p className="text-muted-foreground text-sm">Gestiona los productos para tu pedido B2B</p>
            </div>
          </div>
          {cart && cart.items.length > 0 && (
            <Button variant="destructive" onClick={clearCart} size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> Vaciar
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando carrito...</div>
        ) : !cart || cart.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">El carrito está vacío</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Agrega productos desde el catálogo o la página de productos
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.product.type} {item.product.variety ? `· ${item.product.variety}` : ""}
                          {item.product.origin ? ` · ${item.product.origin}` : ""}
                        </p>
                        {item.lot && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Lote: {item.lot.traceabilityCode}
                          </p>
                        )}
                        <p className="text-sm text-primary mt-1">
                          {fmt(Number(item.unitPrice), item.currency)} / kg
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQty(item.id, Number(item.quantity) - 1)}
                          disabled={Number(item.quantity) <= (item.product.type === "CAFE" ? 100 : 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-16 text-center font-mono text-sm">
                          {Number(item.quantity)} kg
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQty(item.id, Number(item.quantity) + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right min-w-[120px]">
                        <p className="font-semibold">
                          {fmt(Number(item.quantity) * Number(item.unitPrice), item.currency)}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.product.type === "CAFE" && Number(item.quantity) < 100 && (
                      <p className="text-xs text-destructive mt-2">
                        Mínimo de exportación para café: 100 kg
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Subtotal ({cart.itemCount} items)</span>
                  <span className="text-2xl font-bold text-primary">
                    {fmt(cart.subtotal, cart.currency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  El total final se calcula server-side al confirmar el pedido
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
