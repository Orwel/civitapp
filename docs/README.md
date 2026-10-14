# Documentación — Civitapp

## Visión y dominio

| Documento | Descripción |
|-----------|-------------|
| [Visión y alcance](00-overview/vision-y-alcance.md) | Acciones constitucionales, firmas de respaldo |
| [Glosario](00-overview/glosario.md) | Términos de dominio |
| [Acciones constitucionales](02-dominio/acciones-constitucionales.md) | Agregado raíz |
| [Estados y transiciones](02-dominio/estados-accion.md) | Máquina de estados |
| [Catálogo de tipos](02-dominio/catalogo-acciones.md) | 6 tipos judiciales |
| [Motor de plantillas](02-dominio/motor-de-plantillas.md) | Asistente guiado + Handlebars (v1) |
| [Plantilla tutela](02-dominio/plantilla-tutela.md) | Campos, reglas y texto de la tutela (v1) |

## Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [Clean Architecture](01-arquitectura/clean-architecture.md) | Capas |
| [Estructura de carpetas](01-arquitectura/estructura-de-carpetas.md) | `src/` |
| [Flujo de dependencias](01-arquitectura/flujo-de-dependencias.md) | Repos y use cases |

## ADRs

| ADR | Tema |
|-----|------|
| [001](adr/ADR-001-accion-como-agregado-raiz.md) | Agregado raíz |
| [002](adr/ADR-002-estados-y-hitos.md) | Estados |
| [003](adr/ADR-003-firma-equivale-membresia.md) | Firma = membresía |
| [004](adr/ADR-004-identidad-firmable-async.md) | Identidad async |
| [005](adr/ADR-005-minimo-libre-por-lider.md) | Mínimo de firmas |
| [006](adr/ADR-006-composicion-pdf.md) | PDF final |

## Casos de uso

`04-casos-de-uso/` — crear, firmar, recolectar, radicar, PDF, verificación identidad.

## Base de datos y frontend

| Documento | Descripción |
|-----------|-------------|
| [Modelo de dominio](02-dominio/modelo-de-dominio.md) | ERD |
| [Esquema](05-base-de-datos/esquema.md) | Tablas |
| [App Router](06-frontend/app-router-mapa.md) | Rutas |

## Seguimiento

[Sprint tracker](sprints/SPRINT-TRACKER.md)

## Histórico

[Catálogos legacy](02-dominio/catalogos.md) (deprecado)
