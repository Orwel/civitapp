# Catálogo de tipos de acción (`action_types`)

Seed en migraciones `022` (judiciales) y `036` (administrativas). Cada tipo define su comportamiento: ver [ADR-007](../adr/ADR-007-tipos-configurables.md).

| Nombre | slug | Categoría | Término | Firma | Siguiente escalón |
|--------|------|-----------|---------|-------|-------------------|
| Derecho de petición | `derecho_peticion` | ADMINISTRATIVA | 15 días hábiles | SIMPLE | `queja_superservicios` |
| Queja ante la Superservicios | `queja_superservicios` | QUEJA | 15 días hábiles | SIMPLE | `accion_popular` |
| Acción de tutela | `accion_tutela` | JUDICIAL | 10 días hábiles | DRAWN | — |
| Demás acciones judiciales | ver abajo | JUDICIAL | — | DRAWN | — |

Hitos por tipo en `action_type_milestones` (petición: Radicada, Trasladada por competencia, Prórroga, Respondida de fondo, Respuesta evasiva, Vencida sin respuesta).

### Judiciales (022)

| Nombre | slug | Entidad competente (referencia UI) |
|--------|------|-----------------------------------|
| Acción de tutela | `accion_tutela` | Juez (circuito / municipal según materia) |
| Acción popular | `accion_popular` | Juez administrativo |
| Acción de grupo | `accion_grupo` | Juez administrativo |
| Acción de cumplimiento | `accion_cumplimiento` | Juez administrativo / contencioso |
| Acción de nulidad | `accion_nulidad` | Jurisdicción contencioso administrativo |
| Acción de inconstitucionalidad | `accion_inconstitucionalidad` | Corte Constitucional (vía filtro) |

El **mínimo de firmas** lo define el líder al publicar (`minimum_required`), no el catálogo.

## Deprecado

[Catálogos legacy](catalogos.md) (iniciativas, instrumentos participativos, etc.) — solo histórico pre-022.
