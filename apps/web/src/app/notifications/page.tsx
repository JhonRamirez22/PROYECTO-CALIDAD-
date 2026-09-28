"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  ShoppingCart,
  FileText,
  Award,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  ORDER_STATUS_CHANGE: ShoppingCart,
  DOCUMENT_UPLOAD: FileText,
  CERTIFICATE_EXPIRY: Award,
  SYSTEM_ALERT: AlertCircle,
};

const priorityStyles: Record<string, string> = {
  LOW: "border-l-muted",
  MEDIUM: "border-l-primary",
  HIGH: "border-l-destructive",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      params.set("page", page.toString());
      params.set("limit", "15");

      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const [notifRes, unreadRes] = await Promise.all([
        fetch(`${base}/notifications?${params}`),
        fetch(`${base}/notifications/unread-count`),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.data);
        setTotalPages(data.meta.totalPages);
      }
      if (unreadRes.ok) {
        const data = await unreadRes.json();
        setUnreadCount(data.count);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      await fetch(`${base}/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Error marking as read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      await fetch(`${base}/notifications/read-all`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      await fetch(`${base}/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!notifications.find((n) => n.id === id)?.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Error deleting notification:", e);
    }
  };

  const filters = [
    { value: "all", label: "Todas" },
    { value: "ORDER_STATUS_CHANGE", label: "Pedidos" },
    { value: "DOCUMENT_UPLOAD", label: "Documentos" },
    { value: "CERTIFICATE_EXPIRY", label: "Certificados" },
    { value: "SYSTEM_ALERT", label: "Sistema" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notificaciones
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Centro de notificaciones de la plataforma
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications/preferences">
              <Button variant="outline" size="sm">
                Preferencias
              </Button>
            </Link>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todo leído
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
            >
              <Filter className="h-3 w-3 mr-1" />
              {f.label}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 border-b last:border-0 animate-pulse bg-muted/30" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Sin notificaciones</p>
                <p className="text-sm">No hay notificaciones{filter !== "all" ? " en esta categoría" : ""}.</p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Bell;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-4 p-4 border-b last:border-0 transition-colors ${
                        !notif.read ? "bg-primary/5" : ""
                      } border-l-4 ${priorityStyles[notif.priority] || "border-l-muted"}`}
                    >
                      <div className="mt-1">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${!notif.read ? "font-semibold" : "font-medium"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notif.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notif.id)}
                            title="Marcar como leída"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notif.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
