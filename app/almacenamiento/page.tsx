"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const EMAIL_AUTORIZADO = "70246124@jjc.com.pe";

interface TablaUso {
  tabla: string;
  bytes: number;
  filas: number;
}

interface UsoAlmacenamiento {
  total_bytes: number;
  limite_bytes: number;
  tablas: TablaUso[];
}

function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function AlmacenamientoPage() {
  const { session, rol, cargando } = useAuth();
  const [uso, setUso] = useState<UsoAlmacenamiento | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);

  const email = session?.user?.email?.toLowerCase() ?? "";
  const autorizado = rol === "admin" && email === EMAIL_AUTORIZADO;

  const cargar = useCallback(async () => {
    setCargandoDatos(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("obtener_uso_almacenamiento");
      if (error) throw error;
      setUso(data as UsoAlmacenamiento);
      setActualizado(new Date());
    } catch (err: any) {
      setError(err?.message ?? "No se pudo obtener el uso de almacenamiento.");
    } finally {
      setCargandoDatos(false);
    }
  }, []);

  useEffect(() => {
    if (autorizado) cargar();
  }, [autorizado, cargar]);

  if (cargando) return null;

  if (!autorizado) {
    return (
      <div className="text-center">
        <p className="text-sm text-ink/60">No tienes acceso a esta página.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-navy-700">
          Volver
        </Link>
      </div>
    );
  }

  const porcentaje = uso ? (uso.total_bytes / uso.limite_bytes) * 100 : 0;
  const disponible = uso ? uso.limite_bytes - uso.total_bytes : 0;
  const colorBarra =
    porcentaje >= 90 ? "bg-red-500" : porcentaje >= 70 ? "bg-gold-500" : "bg-green-500";

  return (
    <div>
      <Link href="/" className="text-sm text-ink/50 hover:text-ink">
        Cursos
      </Link>

      <div className="mt-4 rounded-2xl bg-navy-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-gold-500">
              JJC Contratistas Generales
            </p>
            <h1 className="mt-0.5 font-display text-xl font-800 text-white">
              Almacenamiento de la base de datos
            </h1>
            <p className="mt-1 text-xs text-white/50">
              Supabase Postgres · Plan gratuito (límite 500 MB)
            </p>
          </div>
          <button
            onClick={cargar}
            disabled={cargandoDatos}
            className="focus-ring shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-50"
          >
            {cargandoDatos ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {uso && (
          <>
            <div className="mt-6">
              <div className="flex items-end justify-between">
                <p className="font-display text-3xl font-800 text-white">
                  {formatearBytes(uso.total_bytes)}
                </p>
                <p className="text-sm text-white/60">de {formatearBytes(uso.limite_bytes)}</p>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${colorBarra}`}
                  style={{ width: `${Math.min(porcentaje, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-white/60">{porcentaje.toFixed(2)}% ocupado</span>
                <span className="text-green-300">{formatearBytes(disponible)} disponibles</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-lg bg-white/5 p-3.5">
                <p className="text-[11px] text-white/50">Ocupado</p>
                <p className="mt-0.5 font-display text-lg font-800 text-white">
                  {formatearBytes(uso.total_bytes)}
                </p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3.5">
                <p className="text-[11px] text-green-300">Disponible</p>
                <p className="mt-0.5 font-display text-lg font-800 text-white">
                  {formatearBytes(disponible)}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3.5">
                <p className="text-[11px] text-white/50">Tablas</p>
                <p className="mt-0.5 font-display text-lg font-800 text-white">
                  {uso.tablas.length}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {actualizado && (
        <p className="mt-3 text-xs text-ink/40">
          Última actualización: {actualizado.toLocaleString("es-PE")}
        </p>
      )}

      <h2 className="mt-8 font-display text-base font-700 text-ink">Desglose por tabla</h2>
      {cargandoDatos && !uso ? (
        <p className="mt-3 text-sm text-ink/50">Cargando...</p>
      ) : uso && uso.tablas.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs text-ink/50">
              <tr>
                <th className="px-4 py-2 font-medium">Tabla</th>
                <th className="px-4 py-2 font-medium">Filas</th>
                <th className="px-4 py-2 font-medium">Tamaño</th>
                <th className="px-4 py-2 font-medium">Proporción</th>
              </tr>
            </thead>
            <tbody>
              {uso.tablas.map((t) => {
                const prop = uso.total_bytes > 0 ? (t.bytes / uso.total_bytes) * 100 : 0;
                return (
                  <tr key={t.tabla} className="border-t border-line">
                    <td className="px-4 py-2.5 font-medium text-ink">{t.tabla}</td>
                    <td className="px-4 py-2.5 text-ink/70">{t.filas.toLocaleString("es-PE")}</td>
                    <td className="px-4 py-2.5 text-ink/70">{formatearBytes(t.bytes)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-navy-700"
                            style={{ width: `${Math.min(prop, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink/50">{prop.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink/50">Sin datos disponibles.</p>
      )}

      <div className="mt-8 rounded-lg border border-line bg-white p-4">
        <p className="text-sm font-medium text-ink">Cómo ampliar el espacio</p>
        <p className="mt-1.5 text-sm text-ink/60">
          El plan gratuito de Supabase incluye 500 MB de base de datos, 1 GB de archivos y 5 GB de
          transferencia mensual. Si te acercas al límite, el plan Pro amplía la base de datos a 8 GB.
          Puedes revisar y cambiar el plan desde Supabase, en Settings y luego Billing.
        </p>
      </div>
    </div>
  );
}
