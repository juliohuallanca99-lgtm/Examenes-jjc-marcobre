"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Rol = "admin" | "editor" | null;

interface AuthContextValue {
  session: Session | null;
  rol: Rol;
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  rol: null,
  cargando: true,
  cerrarSesion: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [rol, setRol] = useState<Rol>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarRol(userId: string) {
    const { data } = await supabase.from("perfiles").select("rol").eq("id", userId).single();
    setRol((data?.rol as Rol) ?? null);
    setCargando(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        cargarRol(data.session.user.id);
      } else {
        setCargando(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        cargarRol(newSession.user.id);
      } else {
        setRol(null);
        setCargando(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, rol, cargando, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
