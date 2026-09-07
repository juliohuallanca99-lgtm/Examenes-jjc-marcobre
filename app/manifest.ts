import type { MetadataRoute } from "next";
import { ICON_192_BASE64, ICON_512_BASE64 } from "@/lib/pwa-icons";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistema de Exámenes CC0174 — JJC Contratistas Generales",
    short_name: "Exámenes JJC",
    description: "Digitalización de exámenes de capacitación para el personal de JJC — Marcobre.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F2138",
    theme_color: "#0F2138",
    orientation: "portrait-primary",
    icons: [
      { src: ICON_192_BASE64, sizes: "192x192", type: "image/jpeg" },
      { src: ICON_512_BASE64, sizes: "512x512", type: "image/jpeg" },
    ],
  };
}
