"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingCart, X, CreditCard, Coffee, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import gsap from "gsap";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  origin: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface InteractiveCheckoutProps {
  products?: Product[];
  onCheckout?: (items: CartItem[], total: number) => void;
}

const defaultProducts: Product[] = [
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

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const onEnter = () => {
      gsap.to(el, {
        y: -4,
        scale: 1.01,
        boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
        duration: 0.25,
        ease: "power2.out",
      });
    };
    const onLeave = () => {
      gsap.to(el, {
        y: 0,
        scale: 1,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        duration: 0.25,
        ease: "power2.out",
      });
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const isCafe = product.category === "Café";

  return (
    <div
      ref={cardRef}
      className={cn(
        "group rounded-xl overflow-hidden",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "transition-colors duration-200"
      )}
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className={cn(
            "absolute top-3 left-3 px-2.5 py-1 text-xs font-medium rounded-full backdrop-blur-sm",
            isCafe
              ? "bg-primary/80 text-white"
              : "bg-accent/80 text-white"
          )}
        >
          {isCafe ? (
            <span className="flex items-center gap-1">
              <Coffee className="w-3 h-3" />
              {product.category}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              {product.category}
            </span>
          )}
        </span>
        <div className="absolute bottom-3 right-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 dark:bg-zinc-900/90 text-foreground backdrop-blur-sm">
            €{product.price.toFixed(2)}/kg
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-heading font-semibold text-base text-foreground">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{product.origin}</p>

        <Button
          size="sm"
          className="w-full mt-3 gap-1.5"
          onClick={() => onAdd(product)}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar al pedido
        </Button>
      </div>
    </div>
  );
}

function InteractiveCheckout({
  products = defaultProducts,
  onCheckout,
}: InteractiveCheckoutProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef<HTMLDivElement>(null);

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });

    // Brief scale pulse on add
    if (cartRef.current) {
      gsap.fromTo(
        cartRef.current,
        { scale: 1 },
        { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0
            ? { ...item, quantity: newQuantity }
            : item;
        }
        return item;
      })
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout(cart, totalPrice);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex gap-8">
        {/* Product grid */}
        <div className="flex-1">
          <div className="grid gap-5 sm:grid-cols-2">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={addToCart}
              />
            ))}
          </div>
        </div>

        {/* Cart sidebar */}
        <motion.div
          ref={cartRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "w-80 flex flex-col",
            "p-5 rounded-xl",
            "bg-white dark:bg-zinc-900",
            "border border-zinc-200 dark:border-zinc-800",
            "shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
            "sticky top-4",
            "max-h-[36rem]"
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Pedido
            </h2>
            {totalItems > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                {totalItems}
              </span>
            )}
          </div>

          <div
            className={cn(
              "flex-1 overflow-y-auto",
              "min-h-0",
              "-mx-5 px-5",
              "space-y-2"
            )}
          >
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Su carrito está vacío
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Agregue productos para comenzar
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      layout: { duration: 0.2 },
                    }}
                    className={cn(
                      "flex items-center gap-3",
                      "p-2.5 rounded-lg",
                      "bg-muted/50 dark:bg-zinc-800/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 ml-2"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                            <Minus className="w-3 h-3" />
                          </motion.button>
                          <motion.span
                            layout
                            className="text-xs text-muted-foreground w-5 text-center font-medium"
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                            <Plus className="w-3 h-3" />
                          </motion.button>
                        </div>
                        <motion.span
                          layout
                          className="text-xs font-medium text-foreground"
                        >
                          €{(item.price * item.quantity).toFixed(2)}
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {cart.length > 0 && (
            <motion.div
              layout
              className={cn(
                "pt-4 mt-4",
                "border-t border-zinc-200 dark:border-zinc-800"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Total
                </span>
                <motion.span
                  layout
                  className="text-base font-heading font-bold text-foreground"
                >
                  €<NumberFlow value={totalPrice} />
                </motion.span>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                <CreditCard className="w-4 h-4" />
                Solicitar Cotización
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export { InteractiveCheckout, type Product, type CartItem };
