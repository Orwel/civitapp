# Plantilla: Acción de tutela (`accion_tutela`, v1)

> Estado: **v1 implementada** en `src/lib/templates/catalog/tutela.ts` (fuente de verdad del texto; este documento resume el diseño). El texto jurídico es borrador técnico y **debe ser revisado por abogado**. Motor: [motor-de-plantillas.md](motor-de-plantillas.md).

Diferencias de la implementación frente al diseño original:
- Claves: `agencia.activa/representado/razon` y `medida_provisional_texto` (en vez de anidar bajo booleanos).
- Se añadieron las cláusulas `procedencia_legitimacion` y `procedencia_inmediatez`, el campo `justificacion_demora` y las reglas `r_hecho_futuro` y `r_email`.
- Selector de entidades (`public_entities`) pendiente: el accionado es texto libre.
- La pretensión «TUTELAR los derechos…» se genera sola; el usuario agrega las órdenes concretas, con botones de agregado rápido según los derechos marcados.

## Base normativa que la plantilla cubre

| Requisito | Fuente | Cómo lo cubre la plantilla |
|-----------|--------|----------------------------|
| Acción u omisión, derecho, accionado, hechos, datos del solicitante | Decreto 2591/1991 art. 14 | Pasos 1–4 obligatorios |
| Juramento de no haber presentado otra tutela por los mismos hechos | Decreto 2591/1991 art. 37 | Paso 6, `boolean` obligatorio |
| Subsidiariedad / perjuicio irremediable | Decreto 2591/1991 art. 6 | Paso 5 + regla `r_subsidiariedad` |
| Tutela contra particulares | Decreto 2591/1991 art. 42 | Campo condicional `accionado.supuesto_particular` |
| Medida provisional | Decreto 2591/1991 art. 7 | Paso 5, opcional |
| Agencia oficiosa | Decreto 2591/1991 art. 10 | Paso 1, condicional |
| Reparto / juez competente | Decreto 1069/2015 art. 2.2.3.1.2.1 (mod. Decreto 333/2021) | Campo derivado `juez_competente` — **verificar con abogado** |
| Inmediatez | Jurisprudencial | Regla `r_inmediatez` (warning) |

## Decisión clave: firmantes = ¿accionantes o coadyuvantes?

En Civitapp una acción reúne firmas. En tutela, solo es **accionante** quien sufre la vulneración (o su agente oficioso). Por eso el paso 1 pregunta:

- **`modalidad = "afectados"`** — todos los firmantes son afectados por los mismos hechos → el escrito habla de "los accionantes que suscriben".
- **`modalidad = "coadyuvancia"`** — hay un accionante (el líder o un tercero identificado) y los demás firmantes **coadyuvan** → el escrito separa accionante y coadyuvantes.

El bloque de firmas no se escribe en el cuerpo: lo agrega `composeActionPdf` al final (nombre, cédula, firma), y el cuerpo solo lo referencia ("identificados como aparece al pie de sus firmas").

## Pasos del asistente (`schema.steps`)

### 1. ¿Quién presenta la tutela?
| key | tipo | notas |
|-----|------|-------|
| `modalidad` | radio | `afectados` / `coadyuvancia` (con explicación en lenguaje simple) |
| `accionante.nombre` | text | visible si `coadyuvancia`; por defecto, perfil del líder |
| `accionante.cedula` | text | idem |
| `accionante.ciudad` | text | requerido (art. 14: lugar de residencia) |
| `accionante.email_notificaciones` | text | requerido |
| `agente_oficioso` | boolean | "¿Actúas en nombre de alguien que no puede hacerlo?" |
| `agente_oficioso.razon` | textarea | visible si `agente_oficioso`; obligatorio |
| `agente_oficioso.representado` | text | nombre de la persona representada |

### 2. ¿Contra quién?
| key | tipo | notas |
|-----|------|-------|
| `accionado.nombre` | entity_picker | `public_entities` o texto libre |
| `accionado.nivel` | select | `nacional`, `departamental`, `distrital`, `municipal`, `particular` |
| `accionado.supuesto_particular` | select | visible si `particular`: `presta_servicio_publico`, `subordinacion`, `indefension` |
| `accionado.email_notificaciones` | text | autollenado desde la entidad si existe |
| `juez_competente` | derivado | se muestra como sugerencia, editable |

### 3. ¿Qué pasó? (hechos)
`hechos`: `repeatable` (min 2, max 30). Cada hecho:

| key | tipo | notas |
|-----|------|-------|
| `fecha` | date | opcional pero recomendado |
| `texto` | textarea | máx. 800 caracteres; ayuda: "Cuenta un solo hecho, en orden, sin opiniones" |
| `tipo` | select | `general`, `peticion_radicada`, `respuesta_negativa`, `sin_respuesta` (activa reglas) |
| `radicado` | text | visible si `tipo = peticion_radicada` |

### 4. ¿Qué derechos se vulneran?
`derechos`: `clause_multi` sobre `template_clauses` con `category = 'derecho'`, min 1.

Cláusulas v1 (slug → base):

| slug | Etiqueta ciudadana | Base |
|------|-------------------|------|
| `derecho_peticion` | "No me responden una solicitud" | C.P. art. 23; Ley 1755/2015 |
| `derecho_salud` | "Me niegan un servicio de salud" | C.P. art. 49; Ley 1751/2015 |
| `debido_proceso` | "Me sancionaron sin dejarme defender" | C.P. art. 29 |
| `igualdad` | "Me tratan distinto sin razón" | C.P. art. 13 |
| `minimo_vital` | "No pagan salario/pensión y no tengo con qué vivir" | C.P. arts. 1, 25, 53 |
| `educacion` | "Me impiden estudiar" | C.P. art. 67 |
| `habeas_data` | "Tienen datos míos falsos o sin permiso" | C.P. art. 15; Ley 1581/2012 |
| `vida_digna` | "Está en riesgo mi vida o integridad" | C.P. art. 11 |

`otro_derecho`: textarea opcional (va como fundamento libre, marcado para revisión).

### 5. ¿Qué pides?
| key | tipo | notas |
|-----|------|-------|
| `pretensiones` | repeatable (min 1, max 10) | `texto`; plantillas rápidas según derechos elegidos (p. ej. petición → "Ordenar a {{accionado}} responder de fondo en 48 horas") |
| `otro_medio_judicial` | radio | `no`, `si_pero_no_eficaz`, `no_se` |
| `perjuicio_irremediable` | textarea | visible si `si_pero_no_eficaz`; obligatorio |
| `medida_provisional` | boolean | |
| `medida_provisional.texto` | textarea | visible si `medida_provisional`; ¿qué urge y por qué? |

### 6. Pruebas y juramento
| key | tipo | notas |
|-----|------|-------|
| `pruebas` | repeatable | `descripcion` + `file_ref` opcional a `action_attachments` |
| `juramento` | boolean | obligatorio = true: "Declaro bajo juramento que no he presentado otra tutela por los mismos hechos y derechos" |

### 7. Vista previa
Render completo + lista de reglas (bloqueantes en rojo, advertencias en ámbar) → "Continuar al editor".

## Reglas (`schema.rules`)

| id | nivel | condición | mensaje |
|----|-------|-----------|---------|
| `r_juramento` | blocking | `juramento != true` | El juramento es requisito del art. 37. |
| `r_derechos` | blocking | `derechos` vacío y `otro_derecho` vacío | Elige al menos un derecho. |
| `r_subsidiariedad` | blocking | `otro_medio_judicial = si_pero_no_eficaz` y `perjuicio_irremediable` vacío | Explica por qué el otro medio no sirve o el perjuicio irremediable. |
| `r_subsidiariedad_ns` | warning | `otro_medio_judicial = no_se` | La tutela puede ser improcedente si existe otro medio. Considera asesoría. |
| `r_inmediatez` | warning | hecho más reciente con `daysSinceGt 180` | Han pasado más de 6 meses; el juez puede declararla improcedente si no justificas la demora. |
| `r_peticion_plazo` | warning | `derecho_peticion` elegido y ningún hecho `peticion_radicada` | Indica cuándo radicaste la petición. |
| `r_peticion_15d` | warning | hecho `peticion_radicada` con menos de 15 días hábiles | Aún no vence el plazo legal de respuesta (Ley 1755/2015). |
| `r_particular` | blocking | `nivel = particular` sin `supuesto_particular` | Contra particulares solo procede en los supuestos del art. 42. |
| `r_agente` | blocking | `agente_oficioso` y `razon` vacía | Explica por qué la persona no puede actuar por sí misma. |
| `r_coadyuvancia` | blocking | `modalidad = coadyuvancia` sin `accionante.cedula` | Identifica al accionante principal. |

## Campo derivado `juez_competente`

`competenciaTutela(accionado.nivel)` — tabla editable por ADMIN, valores iniciales **a verificar**:

| nivel | sugerencia |
|-------|-----------|
| `municipal`, `distrital`, `departamental`, `particular` | Juez Municipal (reparto) de `{{accionante.ciudad}}` |
| `nacional` | Juez del Circuito (reparto) de `{{accionante.ciudad}}` |
| casos especiales (Presidencia, órganos de control, etc.) | Mostrar aviso "requiere verificar competencia" |

## `body_template` (v1, borrador)

```handlebars
<p><strong>Señor(a)</strong><br/>{{mayus juez_competente}}<br/>E. S. D.</p>

<p><strong>Referencia:</strong> Acción de tutela<br/>
<strong>Accionante(s):</strong>
{{#if (eq modalidad "afectados")}}Los ciudadanos firmantes del presente escrito{{else}}{{accionante.nombre}}, C.C. {{accionante.cedula}}{{/if}}<br/>
<strong>Accionado:</strong> {{accionado.nombre}}<br/>
<strong>Derechos invocados:</strong> {{lista_y derechos_labels}}</p>

<p>
{{#if (eq modalidad "afectados")}}
Los suscritos, mayores de edad, identificados como aparece al pie de nuestras firmas, actuando en nombre propio,
{{else}}
{{accionante.nombre}}, mayor de edad, identificado(a) con cédula de ciudadanía No. {{accionante.cedula}}, domiciliado(a) en {{accionante.ciudad}},
{{#if agente_oficioso}}actuando como agente oficioso de {{agente_oficioso.representado}},{{else}}actuando en nombre propio,{{/if}}
coadyuvado(a) por los ciudadanos firmantes identificados al pie del presente escrito,
{{/if}}
respetuosamente interponemos ACCIÓN DE TUTELA consagrada en el artículo 86 de la Constitución Política y reglamentada por el Decreto 2591 de 1991, contra {{mayus accionado.nombre}}, por la vulneración de los derechos fundamentales que se señalan, con fundamento en los siguientes:</p>

<h3>I. HECHOS</h3>
{{#each hechos}}
<p><strong>{{ordinal @index}}.</strong> {{#if fecha}}El {{fecha_larga fecha}}, {{/if}}{{texto}}{{#if radicado}} (radicado No. {{radicado}}){{/if}}</p>
{{/each}}

{{#if agente_oficioso}}
<h3>II. AGENCIA OFICIOSA</h3>
<p>Se actúa como agente oficioso conforme al artículo 10 del Decreto 2591 de 1991, toda vez que {{agente_oficioso.razon}}</p>
{{/if}}

<h3>DERECHOS FUNDAMENTALES VULNERADOS</h3>
{{#each derechos}}{{clausula this}}{{/each}}
{{#if otro_derecho}}<p>{{otro_derecho}}</p>{{/if}}

<h3>PROCEDENCIA</h3>
{{#if (eq accionado.nivel "particular")}}{{clausula (concat "procedencia_particular_" accionado.supuesto_particular)}}{{/if}}
{{#if (eq otro_medio_judicial "si_pero_no_eficaz")}}
{{clausula "procedencia_perjuicio_irremediable"}}
<p>{{perjuicio_irremediable}}</p>
{{else}}
{{clausula "procedencia_subsidiariedad_general"}}
{{/if}}

<h3>PRETENSIONES</h3>
<p>Con fundamento en lo expuesto, solicitamos al señor(a) Juez:</p>
{{#each pretensiones}}
<p><strong>{{ordinal @index}}.</strong> {{texto}}</p>
{{/each}}

{{#if medida_provisional}}
<h3>MEDIDA PROVISIONAL</h3>
<p>Conforme al artículo 7 del Decreto 2591 de 1991, solicitamos como medida provisional: {{medida_provisional.texto}}</p>
{{/if}}

<h3>PRUEBAS</h3>
{{#if pruebas.length}}
<p>Solicitamos tener como pruebas las siguientes:</p>
<ol>{{#each pruebas}}<li>{{descripcion}}</li>{{/each}}</ol>
{{else}}
<p>Las que el despacho considere pertinentes decretar de oficio.</p>
{{/if}}

<h3>JURAMENTO</h3>
<p>Bajo la gravedad del juramento manifestamos que no hemos presentado otra acción de tutela respecto de los mismos hechos y derechos, conforme al artículo 37 del Decreto 2591 de 1991.</p>

<h3>NOTIFICACIONES</h3>
<p><strong>Accionante(s):</strong> {{accionante.email_notificaciones}} — {{accionante.ciudad}}.<br/>
<strong>Accionado:</strong> {{accionado.email_notificaciones}}{{#if accionado.direccion}} — {{accionado.direccion}}{{/if}}.</p>

<p>Atentamente,</p>
<!-- El bloque de firmas lo agrega composeActionPdf -->
```

Helpers adicionales requeridos: `eq`, `concat`. `derechos_labels` se calcula antes del render (labels de las cláusulas elegidas).

## Cláusulas de procedencia v1 (`category = 'procedencia'`)

| slug | contenido (resumen; texto final lo redacta abogado) |
|------|------------------------------------------------------|
| `procedencia_subsidiariedad_general` | No existe otro medio de defensa judicial idóneo y eficaz (art. 6 num. 1). |
| `procedencia_perjuicio_irremediable` | Aunque existe otro medio, se invoca como mecanismo transitorio para evitar un perjuicio irremediable. |
| `procedencia_particular_presta_servicio_publico` | Art. 42: particular encargado de la prestación de un servicio público. |
| `procedencia_particular_subordinacion` | Art. 42: relación de subordinación con el accionado. |
| `procedencia_particular_indefension` | Art. 42: estado de indefensión frente al accionado. |

## Ejemplo de `content_data`

```json
{
  "modalidad": "afectados",
  "accionante": { "ciudad": "Medellín", "email_notificaciones": "lider@ejemplo.com" },
  "accionado": { "nombre": "EPS Ejemplo S.A.S.", "nivel": "particular", "supuesto_particular": "presta_servicio_publico", "email_notificaciones": "notificaciones@eps.example" },
  "juez_competente": "Juez Municipal (reparto) de Medellín",
  "hechos": [
    { "fecha": "2026-08-01", "tipo": "general", "texto": "los accionantes fuimos diagnosticados con ..." },
    { "fecha": "2026-08-20", "tipo": "respuesta_negativa", "texto": "la EPS negó la autorización del procedimiento ..." }
  ],
  "derechos": ["derecho_salud", "vida_digna"],
  "pretensiones": [{ "texto": "Ordenar a la EPS autorizar y practicar el procedimiento en un término de 48 horas." }],
  "otro_medio_judicial": "no",
  "medida_provisional": false,
  "pruebas": [{ "descripcion": "Copia de la negación de servicio del 20 de agosto de 2026." }],
  "juramento": true
}
```

## Pendientes antes de implementar

- [ ] Revisión jurídica del `body_template` y de las 13 cláusulas.
- [ ] Confirmar tabla de competencia/reparto vigente.
- [ ] Definir si en `modalidad = afectados` se pide a cada firmante una línea "cómo me afecta" al firmar (fortalece legitimación).
- [ ] Seed inicial de `public_entities` (EPS, alcaldías capitales, ministerios) — requiere migración.
- [ ] Tests automatizados del evaluador (el repo aún no tiene runner de tests).
