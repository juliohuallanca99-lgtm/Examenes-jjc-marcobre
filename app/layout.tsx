import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";
import Header from "@/components/Header";
import { ICON_192_BASE64 } from "@/lib/pwa-icons";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sistema de Exámenes | JJC Contratistas Generales",
  description: "Digitalización de exámenes de capacitación — CC0174",
  icons: { icon: ICON_192_BASE64, apple: ICON_192_BASE64 },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Exámenes JJC",
  },
};

export const viewport: Viewport = { themeColor: "#0F2138" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${inter.variable} font-body`}>
        <AuthProvider>
          <StoreProvider>
            <AuthGate>
              <Header />
              <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
            </AuthGate>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
