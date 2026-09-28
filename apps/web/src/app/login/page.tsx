"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Eye, EyeOff, FileText, Wheat } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const reduceMotion = useReducedMotion();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-story" aria-label="RiTech Export Desk">
        <div className="login-brand"><span className="brand-mark"><Wheat size={20} /></span><div><strong>RiTech</strong><span>EXPORT DESK</span></div></div>
        <div className="login-story-copy">
          <p className="login-label">DEL ORIGEN AL DESTINO</p>
          <h1>Un lote.<br />Un recorrido.<br /><span>Una historia verificable.</span></h1>
          <p className="max-w-md text-sm leading-6 text-blue-100/80">Coordina café y cacao exclusivos de Nariño con clientes, pedidos y documentos de exportación en un solo expediente.</p>
        </div>
        <div className="manifest-preview" aria-label="Vista ilustrativa del manifiesto de exportación">
          <div className="manifest-preview-top"><span>MANIFIESTO</span><span>RTE · UE</span></div>
          <div className="manifest-preview-route"><span className="route-dot route-dot-origin" /><span className="route-line" /><span className="route-dot route-dot-destination" /></div>
          <div className="manifest-preview-bottom"><span>NARIÑO, COLOMBIA</span><span>ROTTERDAM, NL</span></div>
          <div className="manifest-preview-note"><BadgeCheck size={14} /><span>Trazabilidad en cada etapa</span><FileText size={14} className="ml-auto" /></div>
        </div>
        <p className="login-story-footer">RiTech SAS <span>·</span> Sistema operativo de exportación</p>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
          className="login-form-wrap"
        >
          <div className="mb-9">
            <p className="login-form-kicker">Acceso interno</p>
            <h2 id="login-title" className="mt-2 text-[28px] font-semibold tracking-[-0.045em]">Ingresar a RiTech</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Usa las credenciales asignadas por el administrador del sistema.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold">Correo electrónico</label>
              <input id="email" name="email" type="email" autoComplete="username" required className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="nombre@ritech.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><label htmlFor="password" className="text-xs font-semibold">Contraseña</label><Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">¿La olvidaste?</Link></div>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="h-11 w-full rounded-lg border border-input bg-card px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="••••••••" />
                <button type="button" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">{error}</p>}
            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">
              {loading ? "Verificando acceso…" : "Ingresar"}<ArrowRight size={15} />
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">¿Necesitas acceso? Solicítalo al administrador de RiTech.</p>
          <div className="mt-12 flex items-center justify-center gap-2 text-[10px] text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>CAFÉ · CACAO · EXPORTACIÓN</span><span className="h-px flex-1 bg-border" /></div>
        </motion.div>
      </section>
    </main>
  );
}
