# Mapa del App Router

Next.js 15 — `src/app/`. UI en español.

## Público

| Ruta | Propósito |
|------|-----------|
| `/` | Landing |
| `/acciones/[slug]` | Acción pública: estado, progreso firmas, CTA firmar |
| `/login`, `/register` | Auth con `?next=` |

## Acciones (autenticado)

| Ruta | Propósito |
|------|-----------|
| `/acciones/nueva` | Crear acción |
| `/dashboard` | Mis acciones + firmadas |
| `/dashboard/acciones/[id]` | Hub acción |
| `/dashboard/acciones/[id]/chat` | Chat |
| `/dashboard/acciones/[id]/events` | Bitácora |
| `/dashboard/acciones/[id]/meetups` | Encuentros |
| `/dashboard/acciones/[id]/firmar` | Identidad + firma |
| `/dashboard/profile` | Perfil e identidad |

## Redirects (legacy)

| Antes | Después |
|-------|---------|
| `/dashboard/initiatives/*` | `/dashboard/acciones/*` |
| `/dashboard/explore` | `/acciones` o listado público |

## Admin

| Ruta | Propósito |
|------|-----------|
| `/admin` | Panel |
| `/admin/acciones` | Listado acciones |
| `/admin/identity-verifications` | Cola identidad |
| `/admin/action-templates` | Plantillas |

## API

| Ruta | Propósito |
|------|-----------|
| `/api/cron/evaluate-transitions` | Cron transiciones automáticas |
| `/auth/confirm` | Confirmación Supabase |
