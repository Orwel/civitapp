# Roles en acción constitucional

Tabla: `constitutional_action_roles`.

| Rol | Descripción |
|-----|-------------|
| `CREADOR` | Quien creó la acción. |
| `LIDER` | Gestiona publicación, cierre de firmas, radicación e hitos. |
| `CO_LIDER` | Apoyo con permisos de líder (matriz futura). |
| `APOYO` | Rol de respaldo sin transiciones de estado. |

**Firmar = unirse**: no hay tabla `action_members`; los firmantes acceden a comunidad vía `constitutional_action_signatures`.

Ver [roles-en-iniciativa.md](roles-en-iniciativa.md) (deprecado).
