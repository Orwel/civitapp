# Civitapp

Iniciativa = comunidad + trazabilidad + instrumentos + firmas.

Next.js 15 + Supabase, arquitectura limpia.

## Documentación

Índice en [docs/README.md](docs/README.md) (arquitectura, dominio, permisos, base de datos, App Router). Seguimiento de sprints: [docs/sprints/SPRINT-TRACKER.md](docs/sprints/SPRINT-TRACKER.md).

## Requisitos

- Node.js 18+
- Cuenta Supabase

## Configuración

1. Copia `.env.local.example` a `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. En el proyecto Supabase:
   - Ejecuta **todas** las migraciones en `supabase/migrations/` en orden numérico (001 … 021). Hay dos archivos con prefijo `019_`; el orden alfabético actual es válido; para detalle ver [docs/05-base-de-datos/migraciones.md](docs/05-base-de-datos/migraciones.md).
   - Ejecuta el seed: `supabase/seed/instrument_catalog.sql` (opcional si 013 ya inserta catálogos).
   - En **Ajustes → API** recarga el schema (o reinicia el proyecto) para que PostgREST vea columnas nuevas como `descripcion`.
   - Crea el bucket de storage `attachements_iniciatives` desde el dashboard si la migración 009 no lo crea automáticamente.

   - Para revisar o aplicar migraciones desde la terminal sin el dashboard: `scripts/supabase-civitapp.sh status` (requiere `SUPABASE_ACCESS_TOKEN` y `CIVITAPP_PROJECT_REF`; ver cabecera del script).
   - La migración `024` depende de columnas de la `027`: si corres todo desde cero, vuelve a correr la `024` después de la `027` (la `036` recrea la vista igualmente).
   - Firma por código: configura la plantilla de correo y el SMTP como se indica en [firmar-accion.md](docs/04-casos-de-uso/firmar-accion.md).

3. Instala y arranca:

```bash
npm install
npm run dev
```

## Estructura

- `src/app` — App Router (auth, dashboard, admin)
- `src/core` — Entidades, enums, interfaces de repositorios
- `src/application` — Casos de uso (crear iniciativa, etc.)
- `src/infrastructure` — Cliente Supabase e implementación de repositorios
- `src/components` — Layout (Header, Sidebar, BottomNav, Drawer), features (Chat, Eventos, Instrumentos, Miembros)

## Roles

- **ADMIN** — Acceso al panel `/admin`
- **USER** — Usuario estándar
- **POLITICAL_VERIFIED** — Político validado (puede ser patrocinador en iniciativas)

En cada iniciativa: OWNER, LEADER, MEMBER, OBSERVER, POLITICAL_SPONSOR.
