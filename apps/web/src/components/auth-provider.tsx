"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  if (auth.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!auth.token && !["/login", "/forgot-password", "/reset-password"].includes(window.location.pathname)) {
    return null;
  }

  return <>{children}</>;
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline">{user?.email}</span>
        {user?.roles?.map((role) => (
          <span key={role} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {role}
          </span>
        ))}
      </div>
      <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}
