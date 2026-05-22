# Catálogo de tipos de acción (`action_types`)

Solo acciones **judiciales constitucionales** en el MVP. Seed en migración `022`.

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
