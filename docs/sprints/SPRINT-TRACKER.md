# Seguimiento de sprints — Civitapp

## Sprint actual

**Nombre / fechas**: Sprint 1 — Acciones constitucionales — mayo 2026

**Objetivo**: Pivot a acciones constitucionales como agregado raíz (spec + migración 022 + app).

### Comprometido (este sprint)

- [X] **D3.0** — Tracker + Oleada 3
- [X] **D3.1** — `vision-y-alcance.md`
- [X] **D3.2** — `glosario.md`
- [X] **D3.3** — `estados-accion.md`
- [X] **D3.4** — `acciones-constitucionales.md` + `catalogo-acciones.md`
- [X] **D3.5** — ADR-001 … ADR-006
- [X] **D3.6** — Casos de uso `04-casos-de-uso/`
- [X] **D3.7** — modelo, esquema, app-router
- [X] **T2.1** — Migración `022_constitutional_actions_big_bang.sql`
- [X] **T2.2** — `022` documentado en migraciones.md
- [X] **T3.1** — Rutas públicas `/acciones`, `/acciones/[slug]`
- [X] **T3.2** — Dashboard acciones
- [X] **T3.3** — Flujo firmar + identidad
- [X] **T4.1** — Transiciones manuales (`transition_action_state`, ActionLeaderPanel)
- [X] **T4.2** — Cron `/api/cron/evaluate-transitions`
- [X] **T5.1** — `composeActionPdf.ts` (stub pdf-lib)
- [X] **T5.2** — Admin `/admin/identity-verifications`
- [X] **T5.3** — Plantillas: tabla `action_templates` (CRUD admin UI pendiente ampliación)
- [X] **T6.1** — Admin acciones, redirects legacy, `npm run ci`, build verde

### Retrospectiva (al cerrar)

- Entregado pivot documental + migración 022 + rutas nuevas.
- Legacy iniciativas eliminado de rutas (redirects en `next.config.ts`).
- Pendiente: aplicar migración 022 en Supabase remoto; bucket Storage `action_attachments`; CRUD plantillas admin completo.

---

## Sprint 2 — Lanzamiento derecho de petición (octubre 2026)

- [X] Migración 036: tipos configurables, hitos por tipo, días hábiles, firma simple, storage endurecido
- [X] Firma sin contraseña con código al correo + autorización de datos versionada
- [X] PDF: texto completo, anexo en tabla, QR de verificación, integridad, documento final guardado
- [X] Página pública con documento visible y firma inline; `/verify` con comprobación de hash
- [X] `scripts/supabase-civitapp.sh` (status / sql / apply)
- [ ] Aplicar 036 en Supabase remoto + plantilla de correo con `{{ .Token }}` + SMTP propio
- [ ] Reportes ciudadanos (foto + GPS + hora) y mapa
- [ ] Avisos a firmantes al radicar / vencer término
- [ ] Escalamiento: crear la siguiente acción desde `next_action_type_slug`

---

## Backlog

### Oleada 1 — [X] completada

### Oleada 2 — parcial

- [X] **D2.1**, **D2.2**, **D2.7**, **D2.8** — reemplazados por Oleada 3
- [ ] **D2.3** — Catálogo `event_type`
- [ ] **D2.4** — Matriz permisos detallada
- [ ] **D2.5**, **D2.6** — Político (post-MVP)

### Oleada 3 — [X] Sprint 1

### Técnico

- [X] **T1.1** — Absorbido por 022
- [X] **T1.2** — Documentado (019_* + 022)
- [ ] **T1.3** — ADR errores
- [ ] **T1.4** — Zod
- [ ] **T1.5** — Tests unitarios transiciones
- [X] **T1.6** — Script `npm run ci`

---

## Enlaces

- [Estados](../02-dominio/estados-accion.md)
- [Migración 022](../supabase/migrations/022_constitutional_actions_big_bang.sql)
