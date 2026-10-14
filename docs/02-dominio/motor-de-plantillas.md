# Motor de plantillas (`content_mode = TEMPLATE`)

> Estado: **v1 implementada** (plantillas en código, sin migraciones). Sin IA: todo es determinista (formulario + reglas + texto revisado por abogado).

## Objetivo

Que el ciudadano genere el borrador de una acción respondiendo un asistente paso a paso. Es una de las dos formas de hacer el documento **dentro** de Civitapp (la otra es el editor en blanco); la alternativa externa sigue siendo subir un PDF ya listo.

```
/acciones/nueva  ─ ¿Cómo será el documento? ─┬─ Hacerlo en Civitapp ─┬─ Con plantilla guiada (TEMPLATE)
                                             │                      └─ Desde cero en el editor (TEXT)
                                             └─ Traerlo hecho ──────── Subir PDF (PDF)
```

## Flujo (implementado)

```
TemplateDefinition (código)  ──►  TemplateWizard  ──►  content_data.template.answers
                                                            │
                     body + clauses (Handlebars)  ◄─────────┘
                                │  renderTemplate()
                                ▼
                         content_body (HTML)  ──►  Editor Tiptap  ──►  publicar / firmas / PDF
```

1. `/acciones/nueva`: si el tipo tiene plantilla, aparece "Con plantilla guiada" (por defecto). Al crear: `content_mode = TEMPLATE`, respuestas iniciales con datos del perfil, cuerpo ya renderizado → redirige a `/dashboard/acciones/[id]/plantilla`.
2. El asistente guarda solo (debounce 1,2 s) vía `saveTemplateAnswersAction`, que re-renderiza `content_body` en servidor con la misma función que la vista previa del cliente.
3. "Continuar al editor" lleva al editor Tiptap habitual. Al editar a mano, `content_data.template.body_edited = true` (lo marca `saveActionDraftAction`, que además conserva las respuestas).
4. Si se vuelve al asistente con `body_edited = true`, las respuestas se guardan pero **no** tocan el texto, hasta que el usuario pulse "Regenerar documento" (confirmación explícita).
5. `publishActionAction` (EN_CREACION → EN_FIRMA) bloquea si hay problemas `blocking` de la plantilla y la acción sigue en modo `TEMPLATE`.
6. El PDF final (`buildSignedPdf`) ahora interpreta el HTML (párrafos, títulos, listas, negritas), ajusta líneas y pagina; antes imprimía el HTML crudo en una sola página.

### Persistencia (sin migración)

`constitutional_actions.content_data.template`:

```json
{ "slug": "tutela", "version": 1, "answers": { "...": "..." }, "body_edited": false, "updated_at": "…" }
```

Las columnas `action_templates`, `content_template_id` (022) quedan sin uso por ahora. El enum `action_content_mode` ya incluía `TEMPLATE`.

### Archivos

| Pieza | Ruta |
|-------|------|
| Tipos | `src/core/templates/types.ts` |
| Validación, reglas, utilidades de fecha | `src/core/templates/evaluate.ts` |
| Render Handlebars + helpers | `src/lib/templates/render.ts` |
| Catálogo | `src/lib/templates/catalog/index.ts`, `tutela.ts` |
| Casos de uso | `src/application/actions/templates.ts` |
| Server action | `src/app/(app)/dashboard/acciones/[id]/plantilla/actions.ts` |
| Página + UI | `…/[id]/plantilla/page.tsx`, `src/components/features/templates/TemplateWizard.tsx` |
| HTML → PDF | `src/lib/htmlToPdfBlocks.ts`, `src/lib/buildSignedPdf.ts` |

### Agregar una plantilla nueva

1. Crear `src/lib/templates/catalog/<tipo>.ts` exportando un `TemplateDefinition` con `actionTypeSlug` igual al `slug` de `action_types`.
2. Registrarla en `catalog/index.ts`.
3. Cambiar texto ya publicado ⇒ subir `version` y mantener la anterior en el catálogo (las acciones existentes guardan la versión con la que se crearon).

## Futuro: plantillas editables por ADMIN (requiere migración)

Mover el texto a BD para que un abogado lo edite sin desplegar:

```sql
-- action_templates ya existe (022). Se completa:
ALTER TABLE action_templates
  ADD COLUMN version int NOT NULL DEFAULT 1,
  ADD COLUMN status text NOT NULL DEFAULT 'DRAFT'  -- DRAFT | PUBLISHED | ARCHIVED
    CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  ADD COLUMN reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN reviewed_at timestamptz;
-- Versionado: publicar una nueva versión = nueva fila con mismo slug base + version+1.
-- (cambiar UNIQUE(slug) por UNIQUE(slug, version))

CREATE TABLE template_clauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,                 -- p. ej. 'derecho_salud'
  version int NOT NULL DEFAULT 1,
  action_type_id uuid REFERENCES action_types(id),  -- null = reutilizable
  category text NOT NULL,             -- 'derecho' | 'procedencia' | 'medida' | 'prueba'
  label text NOT NULL,                -- texto de la casilla en el asistente
  help text,                          -- explicación en lenguaje ciudadano
  body text NOT NULL,                 -- Handlebars parcial
  status text NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, version)
);

ALTER TABLE constitutional_actions
  ADD COLUMN content_template_version int,
  ADD COLUMN content_body_edited boolean NOT NULL DEFAULT false;

CREATE TABLE public_entities (          -- autocompletar accionado / destinatario
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nivel text NOT NULL,                -- 'nacional' | 'departamental' | 'distrital' | 'municipal' | 'particular_servicio_publico'
  nit text,
  municipio text,
  departamento text,
  notificaciones_email text,
  direccion text
);
```

RLS: lectura pública de plantillas/cláusulas `PUBLISHED`; escritura solo `ADMIN`. Las reglas y condiciones, hoy funciones TS, tendrían que pasar al DSL JSON de abajo.

## DSL JSON (para la versión en BD)

```jsonc
{
  "version": 1,
  "steps": [
    {
      "id": "partes",
      "title": "¿Contra quién va la tutela?",
      "fields": [
        { "key": "accionado.nombre", "type": "entity_picker", "label": "Entidad o persona", "required": true },
        { "key": "accionado.nivel", "type": "select", "options": ["nacional", "..."], "required": true },
        { "key": "accionado.subordinacion", "type": "select", "visibleIf": { "accionado.nivel": "particular" } }
      ]
    }
  ],
  "rules": [
    { "id": "r1", "level": "blocking|warning", "when": { "...": "..." }, "message": "..." }
  ],
  "derived": {
    "juez_competente": { "fn": "competenciaTutela", "args": ["accionado.nivel"] }
  }
}
```

### Tipos de campo

| Tipo | Uso |
|------|-----|
| `text`, `textarea` | Texto libre corto/largo (con `maxLength`) |
| `date` | Fecha (se formatea con `fecha_larga`) |
| `select`, `radio` | Opciones cerradas |
| `boolean` | Sí/No |
| `repeatable` | Lista de grupos (hechos, pretensiones, pruebas) con `min`/`max` |
| `entity_picker` | Busca en `public_entities`; permite texto libre si no existe |
| `clause_multi` | Casillas que insertan `template_clauses` por `category` |
| `file_ref` | Referencia a `action_attachments` (pruebas) |

### Condiciones (`visibleIf`, `when`)

Objeto plano evaluado con un mini-evaluador propio (sin `eval`): `eq`, `neq`, `in`, `exists`, `gt`, `lt`, `daysSinceGt`, `all`, `any`.

### Helpers Handlebars

| Helper | Ejemplo |
|--------|---------|
| `fecha_larga` | `{{fecha_larga fecha}}` → "14 de octubre de 2026" |
| `ordinal` | `{{ordinal @index}}` → "PRIMERO", "SEGUNDO"… |
| `mayus` | `{{mayus accionado.nombre}}` |
| `lista_y` | `["a","b","c"]` → "a, b y c" |
| `clausula` | `{{clausula "derecho_salud"}}` → renderiza el parcial con el mismo contexto |

Escape HTML por defecto (`{{ }}`); `{{{ }}}` solo para parciales de cláusulas (texto confiable de ADMIN).

## Plantillas previstas

| Orden | Tipo | Doc |
|-------|------|-----|
| 1 | Acción de tutela | [plantilla-tutela.md](plantilla-tutela.md) — **v1 implementada** |
| 2 | Derecho de petición | pendiente (requiere nuevo `action_type`) |
| 3 | Acción popular, cumplimiento | pendiente (+ árbol "¿qué acción me sirve?") |
| 4 | Grupo, nulidad, aviso de reunión pública | pendiente |
