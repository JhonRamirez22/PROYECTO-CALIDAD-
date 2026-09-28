"use client";

import { useState, useEffect } from "react";
import { InteractiveCheckout, type Product } from "@/components/ui/interactive-checkout";
import { useEntranceReveal } from "@/hooks/use-gsap";
import { api } from "@/lib/api";

const fallbackProducts: Product[] = [
  {
    id: "1",
    name: "Café Arábica Huila",
    price: 18.5,
    category: "Café",
    image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&h=400&fit=crop",
    origin: "Huila, Colombia",
  },
  {
    id: "2",
    name: "Cacao Criollo Santander",
    price: 24.0,
    category: "Cacao",
    image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop",
    origin: "Santander, Colombia",
  },
  {
    id: "3",
    name: "Café Washed Nariño",
    price: 21.75,
    category: "Café",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop",
    origin: "Nariño, Colombia",
  },
  {
    id: "4",
    name: "Cacao Trinitario Tolima",
    price: 22.5,
    category: "Cacao",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop",
    origin: "Tolima, Colombia",
  },
];

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const headerRef = useEntranceReveal({ delay: 0.1 });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.get<any[]>("/products");
        if (Array.isArray(data) && data.length > 0) {
          setProducts(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: parseFloat(p.pricePerKg || p.price || "0"),
              category: p.type === "CAFE" ? "Café" : "Cacao",
              image: `https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&h=400&fit=crop`,
              origin: p.region || "Colombia",
            }))
          );
        }
      } catch {
        // Use fallback products
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div ref={headerRef} className="mb-8">
          <h1 className="text-3xl font-heading font-bold">Tienda</h1>
          <p className="text-muted-foreground mt-1">
            Seleccione productos para su pedido de exportación
          </p>
        </div>
        <InteractiveCheckout products={products} />
      </div>
    </div>
  );
}
