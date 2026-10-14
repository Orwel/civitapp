import type {
  TemplateAnswers,
  TemplateClause,
  TemplateDefinition,
} from "@/core/templates/types";
import {
  businessDaysSince,
  daysSince,
  getPath,
  list,
  parseIsoDate,
  str,
} from "@/core/templates/evaluate";

/**
 * Acción de tutela — plantilla v1.
 * Base: C.P. art. 86; Decreto 2591 de 1991; Decreto 1069 de 2015 art. 2.2.3.1.2.1
 * (mod. Decreto 333 de 2021). Texto pendiente de revisión jurídica (ver docs/02-dominio/plantilla-tutela.md).
 */

const NIVELES = [
  { value: "municipal", label: "Entidad municipal o distrital", help: "Alcaldía, secretaría, personería, hospital o colegio público municipal…" },
  { value: "departamental", label: "Entidad departamental", help: "Gobernación, secretaría departamental, hospital departamental…" },
  { value: "nacional", label: "Entidad nacional", help: "Ministerio, superintendencia, Colpensiones, UARIV, DIAN…" },
  { value: "particular", label: "Empresa o persona particular", help: "EPS privada, empresa de servicios públicos, empleador, banco, colegio privado…" },
];

const SUPUESTOS_PARTICULAR = [
  { value: "presta_servicio_publico", label: "Presta un servicio público", help: "Salud (EPS/IPS), educación, servicios domiciliarios (agua, luz, gas)…" },
  { value: "subordinacion", label: "Estoy subordinado a ella", help: "Es mi empleador, o tengo con ella una relación de dependencia." },
  { value: "indefension", label: "Estoy indefenso frente a ella", help: "No tengo medios reales para defenderme de su actuación." },
];

function juezSugerido(answers: TemplateAnswers): string {
  const ciudad = str(getPath(answers, "accionante.ciudad"));
  const sufijo = ciudad ? ` de ${ciudad}` : "";
  switch (str(getPath(answers, "accionado.nivel"))) {
    case "nacional":
      return `Juez del Circuito (reparto)${sufijo}`;
    case "municipal":
    case "departamental":
    case "particular":
      return `Juez Municipal (reparto)${sufijo}`;
    default:
      return `Juez de la República (reparto)${sufijo}`;
  }
}

function hechosConFecha(answers: TemplateAnswers) {
  return list(answers.hechos)
    .map((h) => ({ tipo: str(h.tipo), fecha: parseIsoDate(h.fecha) }))
    .filter((h): h is { tipo: string; fecha: Date } => h.fecha !== null);
}

function derechos(answers: TemplateAnswers): string[] {
  return list<string>(answers.derechos);
}

const CLAUSES: TemplateClause[] = [
  // ---------- Derechos ----------
  {
    slug: "derecho_peticion",
    category: "derecho",
    label: "No me responden una solicitud",
    legalName: "petición",
    help: "Radicaste una petición y no hubo respuesta de fondo en el plazo legal.",
    body: `<p><strong>Derecho fundamental de petición (artículo 23 de la Constitución Política).</strong> Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades, y a ciertos particulares, y a obtener pronta resolución. La Ley 1755 de 2015, estatutaria de este derecho, fija como regla general un término de quince (15) días hábiles para resolver, y exige que la respuesta sea de fondo, clara, precisa, congruente con lo pedido y efectivamente notificada al peticionario. Una respuesta evasiva, incompleta o no comunicada no satisface el derecho. En el presente caso, {{accionado.nombre}} no ha dado respuesta en esos términos a la solicitud descrita en los hechos.</p>`,
  },
  {
    slug: "derecho_salud",
    category: "derecho",
    label: "Me niegan o demoran un servicio de salud",
    legalName: "salud",
    help: "Medicamentos, citas, procedimientos, cirugías, tratamientos o insumos.",
    body: `<p><strong>Derecho fundamental a la salud (artículo 49 de la Constitución Política y Ley Estatutaria 1751 de 2015).</strong> La Ley 1751 de 2015 reconoce la salud como un derecho fundamental autónomo e irrenunciable, que comprende el acceso a los servicios de forma oportuna, eficaz y con calidad, y que se rige, entre otros, por los principios de integralidad, continuidad y oportunidad. Las barreras administrativas para autorizar o prestar un servicio requerido no pueden trasladarse al paciente. La negativa o demora de {{accionado.nombre}} en garantizar lo requerido vulnera este derecho.</p>`,
  },
  {
    slug: "debido_proceso",
    category: "derecho",
    label: "Me sancionaron o decidieron sin dejarme defender",
    legalName: "debido proceso",
    help: "Decisiones administrativas sin notificación, sin poder presentar pruebas o descargos.",
    body: `<p><strong>Derecho fundamental al debido proceso (artículo 29 de la Constitución Política).</strong> El debido proceso se aplica a toda clase de actuaciones judiciales y administrativas, y comprende, entre otras garantías, el derecho a ser oído, a conocer oportunamente las actuaciones, a presentar y controvertir pruebas, a la defensa y a impugnar las decisiones. Las actuaciones de {{accionado.nombre}} descritas en los hechos desconocen estas garantías.</p>`,
  },
  {
    slug: "igualdad",
    category: "derecho",
    label: "Me tratan distinto sin una razón válida",
    legalName: "igualdad",
    help: "Discriminación o trato desigual frente a otras personas en la misma situación.",
    body: `<p><strong>Derecho fundamental a la igualdad (artículo 13 de la Constitución Política).</strong> Todas las personas nacen libres e iguales ante la ley y deben recibir la misma protección y trato de las autoridades, sin discriminación. El Estado debe además adoptar medidas a favor de grupos discriminados o marginados y proteger especialmente a quienes se encuentran en circunstancia de debilidad manifiesta. El trato diferenciado dado por {{accionado.nombre}}, sin justificación objetiva y razonable, vulnera este derecho.</p>`,
  },
  {
    slug: "minimo_vital",
    category: "derecho",
    label: "No me pagan salario o pensión y no tengo con qué vivir",
    legalName: "mínimo vital",
    help: "El no pago afecta tu subsistencia o la de tu familia.",
    body: `<p><strong>Derecho fundamental al mínimo vital (artículos 1, 25, 48 y 53 de la Constitución Política).</strong> La jurisprudencia constitucional ha reconocido el mínimo vital como derecho fundamental derivado del Estado social de derecho, la dignidad humana, el trabajo y la seguridad social. Comprende los recursos indispensables para la subsistencia digna de la persona y su núcleo familiar. Cuando el salario o la pensión constituyen la única fuente de ingresos, su falta de pago afecta directamente este derecho y hace procedente la protección por vía de tutela.</p>`,
  },
  {
    slug: "educacion",
    category: "derecho",
    label: "Me impiden estudiar o continuar mis estudios",
    legalName: "educación",
    help: "Negación de cupo, retención de documentos, expulsión sin debido proceso…",
    body: `<p><strong>Derecho fundamental a la educación (artículos 44 y 67 de la Constitución Política).</strong> La educación es un derecho de la persona y un servicio público con función social. Es fundamental en el caso de niños, niñas y adolescentes, y su núcleo esencial comprende el acceso y la permanencia en el sistema educativo. Las actuaciones de {{accionado.nombre}} descritas en los hechos impiden injustificadamente el acceso o la permanencia en el servicio.</p>`,
  },
  {
    slug: "habeas_data",
    category: "derecho",
    label: "Tienen datos míos falsos, desactualizados o sin permiso",
    legalName: "habeas data",
    help: "Reportes negativos indebidos, datos personales usados sin autorización.",
    body: `<p><strong>Derecho fundamental al habeas data (artículo 15 de la Constitución Política, Ley Estatutaria 1581 de 2012 y Ley 1266 de 2008).</strong> Toda persona tiene derecho a conocer, actualizar y rectificar las informaciones que se hayan recogido sobre ella en bancos de datos y archivos de entidades públicas y privadas. El tratamiento de datos debe respetar los principios de veracidad, finalidad, libertad y circulación restringida. La información tratada por {{accionado.nombre}} desconoce estos principios.</p>`,
  },
  {
    slug: "vida_digna",
    category: "derecho",
    label: "Está en riesgo mi vida, mi integridad o mi dignidad",
    legalName: "vida e integridad personal en condiciones dignas",
    help: "Situaciones que ponen en peligro la vida o la integridad física.",
    body: `<p><strong>Derechos fundamentales a la vida, a la integridad personal y a la dignidad humana (artículos 1, 11 y 12 de la Constitución Política).</strong> El derecho a la vida es inviolable y su protección constitucional no se limita a la mera existencia biológica, sino que comprende la posibilidad de vivir en condiciones dignas. La situación descrita en los hechos, imputable a {{accionado.nombre}}, pone en riesgo cierto estos derechos.</p>`,
  },

  // ---------- Procedencia ----------
  {
    slug: "procedencia_legitimacion",
    category: "procedencia",
    label: "Legitimación",
    legalName: "legitimación",
    body: `<p><strong>Legitimación.</strong> {{#if (eq modalidad "afectados")}}Los accionantes son titulares de los derechos fundamentales cuya protección se solicita y actúan en nombre propio{{else}}{{#if agencia.activa}}El accionante actúa como agente oficioso de {{agencia.representado}}, titular de los derechos invocados, conforme al artículo 10 del Decreto 2591 de 1991{{else}}El accionante es titular de los derechos fundamentales cuya protección se solicita y actúa en nombre propio{{/if}}{{/if}}. {{accionado.nombre}} está legitimado por pasiva, por ser {{#if (eq accionado.nivel "particular")}}el particular{{else}}la autoridad{{/if}} a quien se atribuye la acción u omisión que origina la vulneración.</p>`,
  },
  {
    slug: "procedencia_particular_presta_servicio_publico",
    category: "procedencia",
    label: "Particular que presta un servicio público",
    legalName: "particular que presta servicio público",
    body: `<p><strong>Procedencia contra particulares.</strong> De acuerdo con el inciso final del artículo 86 de la Constitución Política y el artículo 42 del Decreto 2591 de 1991, la acción de tutela procede contra particulares encargados de la prestación de un servicio público, condición que ostenta {{sin_punto accionado.nombre}}.</p>`,
  },
  {
    slug: "procedencia_particular_subordinacion",
    category: "procedencia",
    label: "Particular frente a quien hay subordinación",
    legalName: "subordinación",
    body: `<p><strong>Procedencia contra particulares.</strong> De acuerdo con el inciso final del artículo 86 de la Constitución Política y el numeral 9 del artículo 42 del Decreto 2591 de 1991, la acción de tutela procede contra particulares respecto de quienes el solicitante se encuentra en situación de subordinación, como ocurre en la relación con {{accionado.nombre}} descrita en los hechos.</p>`,
  },
  {
    slug: "procedencia_particular_indefension",
    category: "procedencia",
    label: "Particular frente a quien hay indefensión",
    legalName: "indefensión",
    body: `<p><strong>Procedencia contra particulares.</strong> De acuerdo con el inciso final del artículo 86 de la Constitución Política y el numeral 9 del artículo 42 del Decreto 2591 de 1991, la acción de tutela procede contra particulares respecto de quienes el solicitante se encuentra en estado de indefensión, esto es, sin medios físicos o jurídicos idóneos para repeler la actuación de {{accionado.nombre}}.</p>`,
  },
  {
    slug: "procedencia_subsidiariedad_general",
    category: "procedencia",
    label: "Subsidiariedad (no hay otro medio)",
    legalName: "subsidiariedad",
    body: `<p><strong>Subsidiariedad.</strong> Conforme al numeral 1 del artículo 6 del Decreto 2591 de 1991, no existe otro medio de defensa judicial idóneo y eficaz para obtener la protección inmediata de los derechos fundamentales invocados, por lo que la acción de tutela es el mecanismo procedente.</p>`,
  },
  {
    slug: "procedencia_perjuicio_irremediable",
    category: "procedencia",
    label: "Mecanismo transitorio (perjuicio irremediable)",
    legalName: "perjuicio irremediable",
    body: `<p><strong>Subsidiariedad y perjuicio irremediable.</strong> Aunque podría existir otro medio de defensa judicial, este no resulta eficaz en las circunstancias del caso, y la acción se interpone como mecanismo transitorio para evitar un perjuicio irremediable, en los términos de los artículos 6 y 8 del Decreto 2591 de 1991. El perjuicio es cierto, inminente y grave, y requiere medidas urgentes, por cuanto {{multilinea perjuicio_irremediable}}</p>`,
  },
  {
    slug: "procedencia_inmediatez",
    category: "procedencia",
    label: "Inmediatez",
    legalName: "inmediatez",
    body: `<p><strong>Inmediatez.</strong> La acción se interpone dentro de un término razonable desde la ocurrencia de los hechos que originan la vulneración{{#if justificacion_demora}}. La demora se justifica porque {{multilinea justificacion_demora}}{{else}}, la cual además se mantiene en el tiempo{{/if}}.</p>`,
  },
];

const BODY = `
<p><strong>Señor(a)</strong><br/>{{mayus juez}}<br/>E. S. D.</p>

<p><strong>Referencia:</strong> Acción de tutela<br/>
<strong>Accionante(s):</strong> {{#if (eq modalidad "afectados")}}Los ciudadanos firmantes del presente escrito{{else}}{{accionante.nombre}}, C.C. {{accionante.cedula}}{{#if agencia.activa}}, como agente oficioso de {{agencia.representado}}{{/if}}{{/if}}<br/>
<strong>Accionado:</strong> {{accionado.nombre}}<br/>
<strong>Derechos invocados:</strong> {{lista_y derechos_nombres}}</p>

<p>{{#if (eq modalidad "afectados")}}Los suscritos, mayores de edad, identificados como aparece al pie de nuestras firmas, actuando en nombre propio, {{else}}{{accionante.nombre}}, mayor de edad, identificado(a) con cédula de ciudadanía No. {{accionante.cedula}}, domiciliado(a) en {{accionante.ciudad}}, {{#if agencia.activa}}actuando como agente oficioso de {{agencia.representado}}, {{else}}actuando en nombre propio, {{/if}}con la coadyuvancia de los ciudadanos firmantes identificados al pie del presente escrito, {{/if}}respetuosamente {{#if (eq modalidad "afectados")}}interponemos{{else}}interpongo{{/if}} ACCIÓN DE TUTELA, consagrada en el artículo 86 de la Constitución Política y reglamentada por el Decreto 2591 de 1991, contra {{mayus accionado.nombre}}, por la vulneración de los derechos fundamentales que se señalan, con fundamento en los siguientes:</p>

<h3>I. HECHOS</h3>
{{#each hechos}}
<p><strong>{{ordinal @index}}.</strong> {{#if fecha}}El {{fecha_larga fecha}}, {{multilinea texto}}{{else}}{{multilinea (capitalizar texto)}}{{/if}}{{#if radicado}} (radicado No. {{radicado}}){{/if}}</p>
{{/each}}
{{#if agencia.activa}}
<p><strong>{{ordinal hechos.length}}.</strong> {{agencia.representado}} no puede promover directamente su propia defensa, por cuanto {{multilinea agencia.razon}}</p>
{{/if}}

<h3>II. DERECHOS FUNDAMENTALES VULNERADOS</h3>
{{#each derechos}}{{clausula this}}{{/each}}
{{#if otro_derecho}}<p><strong>Otros derechos.</strong> {{multilinea otro_derecho}}</p>{{/if}}

<h3>III. PROCEDENCIA DE LA ACCIÓN</h3>
{{clausula "procedencia_legitimacion"}}
{{#if (eq accionado.nivel "particular")}}{{clausula (concat "procedencia_particular_" accionado.supuesto_particular)}}{{/if}}
{{#if (eq otro_medio_judicial "si_pero_no_eficaz")}}{{clausula "procedencia_perjuicio_irremediable"}}{{else}}{{clausula "procedencia_subsidiariedad_general"}}{{/if}}
{{clausula "procedencia_inmediatez"}}

<h3>IV. PRETENSIONES</h3>
<p>Con fundamento en lo expuesto, {{#if (eq modalidad "afectados")}}solicitamos{{else}}solicito{{/if}} respetuosamente al señor(a) Juez:</p>
<p><strong>PRIMERO.</strong> TUTELAR los derechos fundamentales {{#if derechos_nombres.length}}de {{lista_y derechos_nombres}}{{else}}invocados{{/if}}{{#if (eq modalidad "afectados")}} de los accionantes{{else}}{{#if agencia.activa}} de {{agencia.representado}}{{else}} del accionante{{/if}}{{/if}}.</p>
{{#each pretensiones}}
<p><strong>{{ordinal (inc @index)}}.</strong> {{multilinea texto}}</p>
{{/each}}

{{#if medida_provisional}}
<h3>V. MEDIDA PROVISIONAL</h3>
<p>Con fundamento en el artículo 7 del Decreto 2591 de 1991, {{#if (eq modalidad "afectados")}}solicitamos{{else}}solicito{{/if}} que, mientras se profiere el fallo, se ordene como medida provisional: {{multilinea medida_provisional_texto}}</p>
{{/if}}

<h3>{{#if medida_provisional}}VI{{else}}V{{/if}}. PRUEBAS</h3>
{{#if pruebas.length}}
<p>{{#if (eq modalidad "afectados")}}Solicitamos{{else}}Solicito{{/if}} tener como pruebas los siguientes documentos:</p>
<ol>{{#each pruebas}}<li>{{descripcion}}</li>{{/each}}</ol>
{{else}}
<p>Las que el despacho considere pertinente decretar de oficio.</p>
{{/if}}

<h3>{{#if medida_provisional}}VII{{else}}VI{{/if}}. JURAMENTO</h3>
<p>Bajo la gravedad del juramento {{#if (eq modalidad "afectados")}}manifestamos{{else}}manifiesto{{/if}} que no {{#if (eq modalidad "afectados")}}hemos{{else}}he{{/if}} presentado otra acción de tutela respecto de los mismos hechos y derechos, conforme al artículo 37 del Decreto 2591 de 1991.</p>

<h3>{{#if medida_provisional}}VIII{{else}}VII{{/if}}. NOTIFICACIONES</h3>
<p><strong>{{#if (eq modalidad "afectados")}}Accionantes{{else}}Accionante{{/if}}:</strong> correo electrónico {{accionante.email_notificaciones}}{{#if accionante.ciudad}}, en la ciudad de {{accionante.ciudad}}{{/if}}.<br/>
<strong>Accionado:</strong> {{#if accionado.email_notificaciones}}correo electrónico {{accionado.email_notificaciones}}{{/if}}{{#if accionado.direccion}}{{#if accionado.email_notificaciones}}; {{/if}}dirección {{accionado.direccion}}{{/if}}{{#unless accionado.email_notificaciones}}{{#unless accionado.direccion}}en la dirección que repose en sus registros públicos{{/unless}}{{/unless}}.</p>

<p>Atentamente,</p>
`;

export const tutelaTemplate: TemplateDefinition = {
  slug: "tutela",
  version: 1,
  actionTypeSlug: "accion_tutela",
  name: "Acción de tutela",
  description:
    "Protege derechos fundamentales vulnerados o amenazados por una autoridad o, en ciertos casos, por un particular. El juez debe decidir en 10 días.",
  clauses: CLAUSES,
  body: BODY,

  initialAnswers: (prefill) => ({
    modalidad: "afectados",
    accionante: {
      nombre: prefill.fullName ?? "",
      cedula: prefill.cedula ?? "",
      email_notificaciones: prefill.email ?? "",
    },
    hechos: [{ tipo: "general" }, { tipo: "general" }],
    derechos: [],
    pretensiones: [],
    otro_medio_judicial: "no",
    medida_provisional: false,
    pruebas: [],
    juramento: false,
  }),

  derive: (answers, clauses) => {
    const byslug = new Map(clauses.map((c) => [c.slug, c]));
    return {
      juez: str(answers.juez_competente) || juezSugerido(answers),
      juez_sugerido: juezSugerido(answers),
      derechos_nombres: derechos(answers)
        .map((s) => byslug.get(s)?.legalName)
        .filter(Boolean),
    };
  },

  steps: [
    {
      id: "accionantes",
      title: "¿Quién presenta la tutela?",
      description:
        "En una tutela solo puede ser accionante quien sufre la vulneración (o quien actúa por esa persona). Los demás firmantes pueden respaldar como coadyuvantes.",
      fields: [
        {
          key: "modalidad",
          type: "radio",
          label: "¿Cómo participan quienes firmen?",
          required: true,
          options: [
            {
              value: "afectados",
              label: "Todos los firmantes somos afectados",
              help: "Cada persona que firme sufre la vulneración por los mismos hechos.",
            },
            {
              value: "coadyuvancia",
              label: "Hay una persona afectada y los demás respaldamos",
              help: "Un accionante principal; los otros firmantes coadyuvan.",
            },
          ],
        },
        {
          key: "accionante.nombre",
          type: "text",
          label: "Nombre completo del accionante",
          required: true,
          visibleIf: (a) => a.modalidad === "coadyuvancia",
        },
        {
          key: "accionante.cedula",
          type: "text",
          label: "Cédula del accionante",
          required: true,
          visibleIf: (a) => a.modalidad === "coadyuvancia",
        },
        {
          key: "agencia.activa",
          type: "boolean",
          label: "Agencia oficiosa",
          checkboxLabel: "El accionante actúa en nombre de otra persona que no puede hacerlo por sí misma",
          visibleIf: (a) => a.modalidad === "coadyuvancia",
        },
        {
          key: "agencia.representado",
          type: "text",
          label: "Nombre de la persona afectada",
          required: true,
          visibleIf: (a) => a.modalidad === "coadyuvancia" && getPath(a, "agencia.activa") === true,
        },
        {
          key: "agencia.razon",
          type: "textarea",
          label: "¿Por qué no puede presentar la tutela por sí misma?",
          placeholder: "se encuentra hospitalizada en unidad de cuidados intensivos desde el …",
          help: "Continúa la frase: «… no puede promover su propia defensa, por cuanto …»",
          required: true,
          maxLength: 800,
          visibleIf: (a) => a.modalidad === "coadyuvancia" && getPath(a, "agencia.activa") === true,
        },
        {
          key: "accionante.ciudad",
          type: "text",
          label: "Ciudad o municipio de residencia",
          help: "Define el juez de reparto y es requisito del escrito.",
          required: true,
        },
        {
          key: "accionante.email_notificaciones",
          type: "text",
          label: "Correo para notificaciones",
          help: "Aquí llegarán la admisión y el fallo. Usa uno que revises.",
          required: true,
        },
      ],
    },
    {
      id: "accionado",
      title: "¿Contra quién va la tutela?",
      fields: [
        {
          key: "accionado.nombre",
          type: "text",
          label: "Nombre de la entidad o persona",
          placeholder: "Ej.: Nueva EPS S.A., Alcaldía de Medellín…",
          required: true,
        },
        {
          key: "accionado.nivel",
          type: "radio",
          label: "¿Qué tipo de accionado es?",
          required: true,
          options: NIVELES,
        },
        {
          key: "accionado.supuesto_particular",
          type: "radio",
          label: "¿Por qué procede contra este particular?",
          help: "Contra particulares la tutela solo procede en estos casos (art. 42, Decreto 2591 de 1991).",
          required: true,
          options: SUPUESTOS_PARTICULAR,
          visibleIf: (a) => getPath(a, "accionado.nivel") === "particular",
        },
        {
          key: "accionado.email_notificaciones",
          type: "text",
          label: "Correo de notificaciones judiciales del accionado (opcional)",
          help: "Suele estar en la página web de la entidad o en su certificado de existencia.",
        },
        {
          key: "accionado.direccion",
          type: "text",
          label: "Dirección física del accionado (opcional)",
        },
        {
          key: "juez_competente",
          type: "text",
          label: "Juez al que se dirige",
          help: "Lo sugerimos según el tipo de accionado y tu ciudad. Déjalo vacío para usar la sugerencia.",
        },
      ],
    },
    {
      id: "hechos",
      title: "¿Qué pasó?",
      description:
        "Cuenta los hechos en orden, uno por bloque, sin opiniones ni insultos. Lo que no esté aquí, el juez no lo conoce.",
      fields: [
        {
          key: "hechos",
          type: "repeatable",
          label: "Hechos",
          itemLabel: "Hecho",
          min: 2,
          max: 30,
          fields: [
            {
              key: "tipo",
              type: "select",
              label: "Tipo de hecho",
              options: [
                { value: "general", label: "Hecho general" },
                { value: "peticion_radicada", label: "Radiqué una solicitud o petición" },
                { value: "respuesta_negativa", label: "Me respondieron negativamente" },
                { value: "sin_respuesta", label: "No me han respondido" },
              ],
            },
            { key: "fecha", type: "date", label: "Fecha (si la sabes)" },
            { key: "radicado", type: "text", label: "Número de radicado (si lo tienes)" },
            {
              key: "texto",
              type: "textarea",
              label: "¿Qué pasó?",
              placeholder: "radiqué ante la EPS la orden médica para la cirugía de …",
              help: "Si pusiste fecha, el escrito empieza con «El [fecha], …».",
              required: true,
              maxLength: 1200,
              rows: 3,
            },
          ],
        },
      ],
    },
    {
      id: "derechos",
      title: "¿Qué derechos se vulneran?",
      description: "Marca los que apliquen. Cada uno agrega su fundamento jurídico al escrito.",
      fields: [
        {
          key: "derechos",
          type: "clause_multi",
          category: "derecho",
          label: "Derechos vulnerados",
        },
        {
          key: "otro_derecho",
          type: "textarea",
          label: "¿Otro derecho? (opcional)",
          help: "Si conoces otro derecho fundamental vulnerado, nómbralo y explica brevemente. Recomendamos revisión de un abogado.",
          maxLength: 1500,
        },
      ],
    },
    {
      id: "pretensiones",
      title: "¿Qué le pides al juez?",
      description:
        "La primera pretensión («tutelar los derechos») se agrega automáticamente. Aquí van las órdenes concretas.",
      fields: [
        {
          key: "pretensiones",
          type: "repeatable",
          label: "Órdenes que solicitas",
          itemLabel: "Pretensión",
          min: 1,
          max: 10,
          fields: [
            {
              key: "texto",
              type: "textarea",
              label: "Orden",
              placeholder: "ORDENAR a … que en el término de cuarenta y ocho (48) horas …",
              required: true,
              maxLength: 1000,
              rows: 3,
            },
          ],
          quickAdd: (a) => {
            const acc = str(getPath(a, "accionado.nombre")) || "la entidad accionada";
            const out: { label: string; item: TemplateAnswers }[] = [];
            const ds = derechos(a);
            if (ds.includes("derecho_peticion"))
              out.push({
                label: "Responder la petición",
                item: {
                  texto: `ORDENAR a ${acc} que, en el término de cuarenta y ocho (48) horas siguientes a la notificación del fallo, dé respuesta de fondo, clara, precisa y congruente a la petición descrita en los hechos, y la notifique en debida forma.`,
                },
              });
            if (ds.includes("derecho_salud"))
              out.push({
                label: "Autorizar y prestar el servicio de salud",
                item: {
                  texto: `ORDENAR a ${acc} que, en el término de cuarenta y ocho (48) horas siguientes a la notificación del fallo, autorice y garantice efectivamente [describir el servicio, medicamento o procedimiento], conforme a lo ordenado por el médico tratante.`,
                },
              });
            if (ds.includes("derecho_salud"))
              out.push({
                label: "Tratamiento integral",
                item: {
                  texto: `ORDENAR a ${acc} que garantice el tratamiento integral requerido para la patología descrita en los hechos, sin imponer barreras administrativas.`,
                },
              });
            if (ds.includes("minimo_vital"))
              out.push({
                label: "Pagar lo adeudado",
                item: {
                  texto: `ORDENAR a ${acc} que, en el término de cuarenta y ocho (48) horas siguientes a la notificación del fallo, pague [salarios / mesadas pensionales] adeudados desde [fecha].`,
                },
              });
            if (ds.includes("habeas_data"))
              out.push({
                label: "Corregir o eliminar el dato",
                item: {
                  texto: `ORDENAR a ${acc} que, en el término de cuarenta y ocho (48) horas siguientes a la notificación del fallo, rectifique, actualice o suprima la información descrita en los hechos.`,
                },
              });
            if (ds.includes("debido_proceso"))
              out.push({
                label: "Dejar sin efectos la decisión",
                item: {
                  texto: `DEJAR SIN EFECTOS [identificar la decisión] adoptada por ${acc} y ORDENAR que rehaga la actuación con plena observancia del debido proceso.`,
                },
              });
            out.push({
              label: "Abstenerse de repetir",
              item: {
                texto: `PREVENIR a ${acc} para que en lo sucesivo se abstenga de incurrir en las acciones u omisiones que dieron origen a esta tutela.`,
              },
            });
            return out;
          },
        },
        {
          key: "otro_medio_judicial",
          type: "radio",
          label: "¿Existe otro proceso judicial para reclamar esto?",
          help: "La tutela es subsidiaria: si hay otro medio eficaz, el juez puede declararla improcedente.",
          required: true,
          options: [
            { value: "no", label: "No, o no es eficaz para proteger el derecho a tiempo" },
            {
              value: "si_pero_no_eficaz",
              label: "Sí existe, pero hay un perjuicio irremediable",
              help: "Se pide la tutela como mecanismo transitorio.",
            },
            { value: "no_se", label: "No lo sé" },
          ],
        },
        {
          key: "perjuicio_irremediable",
          type: "textarea",
          label: "¿Por qué no se puede esperar al otro proceso?",
          help: "Continúa la frase: «… requiere medidas urgentes, por cuanto …»",
          required: true,
          maxLength: 1200,
          visibleIf: (a) => a.otro_medio_judicial === "si_pero_no_eficaz",
        },
        {
          key: "medida_provisional",
          type: "boolean",
          label: "Medida provisional",
          checkboxLabel: "Es tan urgente que pido al juez una orden inmediata, antes del fallo",
        },
        {
          key: "medida_provisional_texto",
          type: "textarea",
          label: "¿Qué orden urgente pides y por qué?",
          required: true,
          maxLength: 1200,
          visibleIf: (a) => a.medida_provisional === true,
        },
        {
          key: "justificacion_demora",
          type: "textarea",
          label: "¿Por qué no se presentó antes? (opcional)",
          help: "Solo si han pasado más de seis meses desde los hechos. Continúa: «La demora se justifica porque …»",
          maxLength: 800,
        },
      ],
    },
    {
      id: "pruebas",
      title: "Pruebas y juramento",
      fields: [
        {
          key: "pruebas",
          type: "repeatable",
          label: "Documentos que anexas",
          itemLabel: "Prueba",
          max: 30,
          fields: [
            {
              key: "descripcion",
              type: "text",
              label: "Descripción",
              placeholder: "Copia de la petición radicada el 3 de agosto de 2026.",
              required: true,
              maxLength: 300,
            },
          ],
        },
        {
          key: "juramento",
          type: "boolean",
          label: "Juramento",
          checkboxLabel:
            "Declaro bajo juramento que no se ha presentado otra tutela por los mismos hechos y derechos.",
          help: "Es requisito del artículo 37 del Decreto 2591 de 1991. Presentar tutelas duplicadas puede acarrear sanciones.",
          required: true,
        },
      ],
    },
  ],

  rules: [
    {
      id: "r_derechos",
      level: "blocking",
      step: "derechos",
      message: "Elige al menos un derecho vulnerado o describe otro.",
      when: (a) => derechos(a).length === 0 && !str(a.otro_derecho),
    },
    {
      id: "r_subsidiariedad_ns",
      level: "warning",
      step: "pretensiones",
      message:
        "Si existe otro proceso judicial eficaz, la tutela puede ser declarada improcedente. Considera asesoría antes de publicar.",
      when: (a) => a.otro_medio_judicial === "no_se",
    },
    {
      id: "r_inmediatez",
      level: "warning",
      step: "pretensiones",
      message:
        "El hecho más reciente tiene más de seis meses. Explica por qué no se presentó antes, o el juez podría declararla improcedente.",
      when: (a) => {
        const fechas = hechosConFecha(a).map((h) => h.fecha.getTime());
        if (fechas.length === 0) return false;
        return daysSince(new Date(Math.max(...fechas))) > 180 && !str(a.justificacion_demora);
      },
    },
    {
      id: "r_peticion_radicada",
      level: "warning",
      step: "hechos",
      message:
        "Marcaste el derecho de petición: agrega un hecho de tipo «Radiqué una solicitud» con su fecha.",
      when: (a) =>
        derechos(a).includes("derecho_peticion") &&
        !list(a.hechos).some((h) => h.tipo === "peticion_radicada" && parseIsoDate(h.fecha)),
    },
    {
      id: "r_peticion_15d",
      level: "warning",
      step: "hechos",
      message:
        "Aún no han pasado 15 días hábiles desde que radicaste la petición: el plazo legal de respuesta podría no haber vencido (Ley 1755 de 2015).",
      when: (a) =>
        derechos(a).includes("derecho_peticion") &&
        hechosConFecha(a).some(
          (h) => h.tipo === "peticion_radicada" && businessDaysSince(h.fecha) < 15
        ),
    },
    {
      id: "r_hecho_futuro",
      level: "blocking",
      step: "hechos",
      message: "Hay un hecho con fecha futura.",
      when: (a) => hechosConFecha(a).some((h) => daysSince(h.fecha) < 0),
    },
    {
      id: "r_email",
      level: "blocking",
      step: "accionantes",
      message: "El correo de notificaciones no parece válido.",
      when: (a) => {
        const v = str(getPath(a, "accionante.email_notificaciones"));
        return v !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
    },
  ],
};
