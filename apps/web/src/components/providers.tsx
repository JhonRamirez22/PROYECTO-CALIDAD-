"use client";

import { AuthProvider as AuthProviderImpl } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProviderImpl>{children}</AuthProviderImpl>;
}
