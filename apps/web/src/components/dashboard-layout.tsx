"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { loading, user } = useAuth();

  if (loading) {
    return <main aria-busy="true" className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Cargando espacio de trabajo…</main>;
  }
  if (!user) return null;

  return (
    <div className="workspace-frame">
      {mobileNavOpen && (
        <button
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <Sidebar open={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <div className="workspace-column">
        <Navbar onMenuClick={() => setMobileNavOpen((open) => !open)} />
        <main id="main-content" className="workspace-main">
          <div className="workspace-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
