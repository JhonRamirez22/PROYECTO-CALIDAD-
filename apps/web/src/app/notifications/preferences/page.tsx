"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Preferences {
  orderStatusEmail: boolean;
  orderStatusInApp: boolean;
  documentUploadEmail: boolean;
  documentUploadInApp: boolean;
  certificateExpiryEmail: boolean;
  certificateExpiryInApp: boolean;
  systemAlertEmail: boolean;
  systemAlertInApp: boolean;
  frequency: string;
  additionalRecipients: string[];
}

const defaultPrefs: Preferences = {
  orderStatusEmail: true,
  orderStatusInApp: true,
  documentUploadEmail: true,
  documentUploadInApp: true,
  certificateExpiryEmail: true,
  certificateExpiryInApp: true,
  systemAlertEmail: true,
  systemAlertInApp: true,
  frequency: "INSTANT",
  additionalRecipients: [],
};

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${base}/notifications/preferences`);
        if (res.ok) {
          const data = await res.json();
          setPrefs({
            orderStatusEmail: data.orderStatusEmail ?? true,
            orderStatusInApp: data.orderStatusInApp ?? true,
            documentUploadEmail: data.documentUploadEmail ?? true,
            documentUploadInApp: data.documentUploadInApp ?? true,
            certificateExpiryEmail: data.certificateExpiryEmail ?? true,
            certificateExpiryInApp: data.certificateExpiryInApp ?? true,
            systemAlertEmail: data.systemAlertEmail ?? true,
            systemAlertInApp: data.systemAlertInApp ?? true,
            frequency: data.frequency ?? "INSTANT",
            additionalRecipients: data.additionalRecipients ?? [],
          });
        }
      } catch (e) {
        console.error("Error fetching preferences:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${base}/notifications/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        alert("Preferencias guardadas");
      }
    } catch (e) {
      console.error("Error saving preferences:", e);
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = () => {
    if (newEmail && newEmail.includes("@") && !prefs.additionalRecipients.includes(newEmail)) {
      setPrefs((p) => ({
        ...p,
        additionalRecipients: [...p.additionalRecipients, newEmail],
      }));
      setNewEmail("");
    }
  };

  const removeRecipient = (email: string) => {
    setPrefs((p) => ({
      ...p,
      additionalRecipients: p.additionalRecipients.filter((e) => e !== email),
    }));
  };

  const toggle = (key: keyof Preferences) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const categories = [
    {
      key: "orderStatus" as const,
      title: "Estado de Pedidos",
      description: "Notificaciones cuando un pedido cambia de estado",
    },
    {
      key: "documentUpload" as const,
      title: "Documentos",
      description: "Notificaciones cuando se suben documentos nuevos",
    },
    {
      key: "certificateExpiry" as const,
      title: "Certificados",
      description: "Alertas de vencimiento de certificados",
    },
    {
      key: "systemAlert" as const,
      title: "Sistema",
      description: "Alertas del sistema y mantenimiento",
    },
  ];

  const frequencies = [
    { value: "INSTANT", label: "Inmediato" },
    { value: "DAILY", label: "Diario (resumen)" },
    { value: "WEEKLY", label: "Semanal (resumen)" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Link href="/notifications">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Preferencias
            </h1>
            <p className="text-muted-foreground">
              Configura cómo y cuándo recibir notificaciones
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Notification Categories */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Tipos de Notificación</CardTitle>
                <CardDescription>
                  Activa o desactiva notificaciones por tipo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {categories.map((cat) => (
                  <div key={cat.key} className="space-y-3">
                    <div>
                      <p className="font-medium text-sm">{cat.title}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prefs[`${cat.key}Email` as keyof Preferences] as boolean}
                          onChange={() => toggle(`${cat.key}Email` as keyof Preferences)}
                          className="rounded border-input"
                        />
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prefs[`${cat.key}InApp` as keyof Preferences] as boolean}
                          onChange={() => toggle(`${cat.key}InApp` as keyof Preferences)}
                          className="rounded border-input"
                        />
                        <Bell className="h-4 w-4" />
                        <span className="text-sm">En la app</span>
                      </label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Frequency */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Frecuencia de Resúmenes</CardTitle>
                <CardDescription>
                  Para notificaciones por email, elige la frecuencia del resumen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {frequencies.map((f) => (
                    <Button
                      key={f.value}
                      variant={prefs.frequency === f.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrefs((p) => ({ ...p, frequency: f.value }))}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Recipients */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Destinatarios Adicionales</CardTitle>
                <CardDescription>
                  Emails adicionales que recibirán copia de las notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="flex-1 border rounded-md px-3 py-2 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                  />
                  <Button variant="outline" size="sm" onClick={addRecipient}>
                    Agregar
                  </Button>
                </div>
                {prefs.additionalRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {prefs.additionalRecipients.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm"
                      >
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
