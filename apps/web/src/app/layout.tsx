import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RiTech Export — Café y Cacao de Nariño",
  description:
    "Plataforma B2B de exportación de café y cacao exclusivos de Nariño para compradores europeos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${jakarta.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>
          <Providers>{children}</Providers>
        </MotionProvider>
      </body>
    </html>
  );
}
