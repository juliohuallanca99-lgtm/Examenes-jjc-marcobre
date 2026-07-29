-- ============================================================
-- Sistema de Exámenes Digitales - JJC Contratistas Generales
-- Esquema de base de datos (Supabase / PostgreSQL)
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. CURSOS
-- Cada curso agrupa un set de preguntas y define la nota mínima
-- ------------------------------------------------------------
create table cursos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  nota_minima_aprobatoria numeric not null default 14,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PREGUNTAS
-- Soporta cualquier tipo de pregunta mediante 'tipo' + JSONB
--   opcion_multiple -> opciones: [{"id":"a","texto":"..."}...] / respuesta_correcta: "a" (o ["a","c"] si es de varias correctas)
--   verdadero_falso -> respuesta_correcta: true/false
--   numerica        -> respuesta_correcta: 12.5 (con margen_error opcional)
--   abierta         -> respuesta_correcta: null (requiere revisión manual)
-- ------------------------------------------------------------
create table preguntas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos(id) on delete cascade,
  orden integer not null default 0,
  tipo text not null check (tipo in ('opcion_multiple','verdadero_falso','numerica','abierta')),
  enunciado text not null,
  opciones jsonb,              -- solo para opcion_multiple
  respuesta_correcta jsonb,    -- null si es 'abierta'
  margen_error numeric,        -- solo para numerica (opcional)
  puntaje numeric not null default 1,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. INTENTOS DE EXAMEN (un registro por trabajador que rinde)
-- ------------------------------------------------------------
create table intentos_examen (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos(id),
  dni text not null,
  nombres text not null,
  apellidos text not null,
  fecha_inicio timestamptz not null default now(),
  fecha_fin timestamptz,
  respuestas jsonb not null default '[]'::jsonb,  -- [{pregunta_id, respuesta_dada, puntaje_obtenido}]
  nota numeric,                -- 0 a 20, null hasta calificar
  estado text not null default 'en_curso'
    check (estado in ('en_curso','pendiente_revision','aprobado','desaprobado')),
  pdf_url text,                -- constancia generada, una vez calificado
  created_at timestamptz not null default now()
);

-- Índices para búsqueda rápida por trabajador (historial) y por curso
create index idx_intentos_dni on intentos_examen (dni);
create index idx_intentos_curso on intentos_examen (curso_id);
create index idx_intentos_estado on intentos_examen (estado);

-- ------------------------------------------------------------
-- Vista de apoyo: historial consolidado por trabajador
-- ------------------------------------------------------------
create view vista_historial_trabajador as
select
  i.dni,
  i.nombres,
  i.apellidos,
  c.nombre as curso,
  i.nota,
  i.estado,
  i.fecha_fin,
  i.pdf_url
from intentos_examen i
join cursos c on c.id = i.curso_id
order by i.fecha_fin desc nulls last;
