"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface Item {
  id: string;
  created_at: string;
  usuario_email: string | null;
  accion: string;
  entidad: string;
  descripcion: string | null;
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistorialPage() {
  const { rol, cargando } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    if (rol !== "admin") return;
    supabase
      .from("historial_acciones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setItems((data as Item[]) ?? []);
        setCargandoDatos(false);
      });
  }, [rol]);

  if (cargando) return null;

  if (rol !== "admin") {
    return (
      <div className="text-center">
        <p className="text-sm text-ink/60">No tienes acceso a esta página.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-navy-700">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="text-sm text-ink/50 hover:text-ink">
        Cursos
      </Link>
      <h1 className="mt-2 font-display text-2xl font-800 text-ink">Historial de acciones</h1>
      <p className="mt-1 text-sm text-ink/60">Registro de creaciones y eliminaciones.</p>

      {cargandoDatos ? (
        <p className="mt-6 text-sm text-ink/50">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-ink/50">Todavía no hay registros.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs text-ink/50">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Acción</th>
                <th className="px-4 py-2 font-medium">Entidad</th>
                <th className="px-4 py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-ink/50">{formatearFecha(it.created_at)}</td>
                  <td className="px-4 py-2.5 text-ink">{it.usuario_email}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        it.accion === "eliminar"
                          ? "bg-red-50 text-red-600"
                          : "bg-gold-100 text-gold-600"
                      }`}
                    >
                      {it.accion === "eliminar" ? "Eliminó" : "Agregó"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink/70">{it.entidad}</td>
                  <td className="px-4 py-2.5 text-ink">{it.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
