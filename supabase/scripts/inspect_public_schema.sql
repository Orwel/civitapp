-- Ejecuta este script en el SQL Editor de Supabase para ver la estructura del esquema public.
-- Así puedes comprobar qué tablas y columnas existen y qué podría faltar.

-- 0) Políticas RLS en initiative_members (útil si falla el insert por RLS)
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr, pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy
WHERE polrelid = 'public.initiative_members'::regclass;

-- 1) Tablas del esquema public
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2) Columnas de la tabla initiatives (la que usa descripcion, estado, initiative_type_id, etc.)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'initiatives'
ORDER BY ordinal_position;

-- 3) Tablas de catálogo que debe tener la app (initiative_types, instrument_categories, instrument_types)
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('initiative_types', 'instrument_categories', 'instrument_types')
ORDER BY table_name;

-- 4) Tipos ENUM que usan las migraciones (initiative_state, initiative_substate para 015/016)
SELECT
  t.typname AS enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN ('initiative_state', 'initiative_substate', 'instrument_state')
GROUP BY t.typname;
