# Acciones constitucionales

## Definición

Una **acción constitucional** en Civitapp es el agregado raíz que agrupa:

- Tipo judicial (catálogo de 6).
- Contenido del documento (plantilla admin, texto libre o PDF subido).
- Ciclo de vida (estados, hitos, resultado).
- Firmas de respaldo ciudadano.
- Comunidad (chat, bitácora, encuentros) para quienes firman o tienen rol.

## Firmas de respaldo vs. trámite legal

Las firmas capturadas en la app son **respaldo organizado** de ciudadanos con identidad en perfil. No reemplazan requisitos procesales del juez o tribunal (p. ej. legitimación en acción popular). El líder radica con el PDF que integra documento + firmas.

## Modos de contenido (`action_content_mode`)

| Modo | Descripción |
|------|-------------|
| `TEMPLATE` | Formulario dinámico desde `action_templates` (ADMIN). |
| `TEXT` | Editor de texto en la app. |
| `PDF` | Archivo subido a Storage. |

## Roles (`constitutional_action_roles`)

| Rol | Capacidades típicas |
|-----|---------------------|
| `CREADOR` | Creó la acción; puede publicar y radicar. |
| `LIDER` | Misma gestión operativa que creador. |
| `CO_LIDER` | Apoyo en gestión (configurable en matriz). |
| `APOYO` | Rol de respaldo sin transiciones de estado. |

## Visibilidad

- `PUBLIC`: listada y accesible por slug.
- `UNLISTED`: solo con enlace directo.

## Referencias

- [Catálogo de tipos](catalogo-acciones.md)
- [Estados](estados-accion.md)
