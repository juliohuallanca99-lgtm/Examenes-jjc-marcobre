import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";
import AppShell from "@/components/AppShell";
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

export const viewport: Viewport = { themeColor: "#202140" };

// Se aplica el tema guardado antes de que el navegador pinte la pagina. Sin
// esto, el sitio aparece un instante en claro y salta a oscuro, que molesta
// bastante de noche. suppressHydrationWarning evita que React reclame por la
// clase que este script agrega antes de que el arranque.
const APLICAR_TEMA = `
try {
  var t = localStorage.getItem('jjc-tema');
  if (t === 'oscuro') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
      </head>
      <body className={`${manrope.variable} ${inter.variable} font-body`}>
        <AuthProvider>
          <StoreProvider>
            <AuthGate>
              <AppShell>{children}</AppShell>
            </AuthGate>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
