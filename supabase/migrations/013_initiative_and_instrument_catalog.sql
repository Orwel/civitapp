-- Catálogos: tipos de iniciativa, categorías de instrumentos y tipos de instrumentos (en BD)

-- 1. Tipos de iniciativa
CREATE TABLE initiative_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_initiative_types_slug ON initiative_types(slug);

INSERT INTO initiative_types (name, slug, order_index) VALUES
  ('Ambiental', 'ambiental', 1),
  ('Social', 'social', 2),
  ('Denuncia', 'denuncia', 3),
  ('Obra pública', 'obra_publica', 4),
  ('Empresarial (económica)', 'empresarial', 5);

-- 2. Categorías de instrumentos
CREATE TABLE instrument_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_instrument_categories_slug ON instrument_categories(slug);

INSERT INTO instrument_categories (name, slug, order_index) VALUES
  ('Instrumentos Administrativos', 'administrativos', 1),
  ('Instrumentos Judiciales', 'judiciales', 2),
  ('Instrumentos Participativos', 'participativos', 3),
  ('Instrumentos de Incidencia Técnica', 'incidencia_tecnica', 4),
  ('Instrumentos Comunicativos', 'comunicativos', 5);

-- 3. Tipos de instrumentos (por categoría)
CREATE TABLE instrument_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES instrument_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  requires_signatures boolean NOT NULL DEFAULT false,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

CREATE INDEX idx_instrument_types_category ON instrument_types(category_id);
CREATE INDEX idx_instrument_types_slug ON instrument_types(slug);

-- Administrativos
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Derecho de petición', 'derecho_peticion', false, 1 FROM instrument_categories WHERE slug = 'administrativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Queja disciplinaria', 'queja_disciplinaria', false, 2 FROM instrument_categories WHERE slug = 'administrativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Solicitud de información', 'solicitud_informacion', false, 3 FROM instrument_categories WHERE slug = 'administrativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Recurso administrativo', 'recurso_administrativo', false, 4 FROM instrument_categories WHERE slug = 'administrativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Solicitud de audiencia pública', 'solicitud_audiencia_publica', false, 5 FROM instrument_categories WHERE slug = 'administrativos';

-- Judiciales
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Acción de tutela', 'accion_tutela', false, 1 FROM instrument_categories WHERE slug = 'judiciales';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Acción popular', 'accion_popular', false, 2 FROM instrument_categories WHERE slug = 'judiciales';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Acción de grupo', 'accion_grupo', false, 3 FROM instrument_categories WHERE slug = 'judiciales';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Acción de cumplimiento', 'accion_cumplimiento', false, 4 FROM instrument_categories WHERE slug = 'judiciales';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Acción de nulidad', 'accion_nulidad', false, 5 FROM instrument_categories WHERE slug = 'judiciales';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Acción de inconstitucionalidad', 'accion_inconstitucionalidad', false, 6 FROM instrument_categories WHERE slug = 'judiciales';

-- Participativos (varios requieren firmas)
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Recolección de firmas', 'recoleccion_firmas', true, 1 FROM instrument_categories WHERE slug = 'participativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Consulta ciudadana', 'consulta_ciudadana', false, 2 FROM instrument_categories WHERE slug = 'participativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Cabildo abierto', 'cabildo_abierto', false, 3 FROM instrument_categories WHERE slug = 'participativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Revocatoria', 'revocatoria', true, 4 FROM instrument_categories WHERE slug = 'participativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Referendo', 'referendo', true, 5 FROM instrument_categories WHERE slug = 'participativos';

-- Incidencia técnica
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Informe técnico ciudadano', 'informe_tecnico_ciudadano', false, 1 FROM instrument_categories WHERE slug = 'incidencia_tecnica';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Estudio independiente', 'estudio_independiente', false, 2 FROM instrument_categories WHERE slug = 'incidencia_tecnica';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Auditoría social', 'auditoria_social', false, 3 FROM instrument_categories WHERE slug = 'incidencia_tecnica';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Observatorio ciudadano', 'observatorio_ciudadano', false, 4 FROM instrument_categories WHERE slug = 'incidencia_tecnica';

-- Comunicativos
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Comunicado público', 'comunicado_publico', false, 1 FROM instrument_categories WHERE slug = 'comunicativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Petición masiva digital', 'peticion_masiva_digital', false, 2 FROM instrument_categories WHERE slug = 'comunicativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Campaña de presión institucional', 'campana_presion_institucional', false, 3 FROM instrument_categories WHERE slug = 'comunicativos';
INSERT INTO instrument_types (category_id, name, slug, requires_signatures, order_index)
SELECT id, 'Solicitud formal a medios', 'solicitud_formal_medios', false, 4 FROM instrument_categories WHERE slug = 'comunicativos';

COMMENT ON TABLE initiative_types IS 'Tipos de iniciativa: ambiental, social, denuncia, obra pública, empresarial.';
COMMENT ON TABLE instrument_categories IS 'Categorías de instrumentos: Administrativos, Judiciales, Participativos, etc.';
COMMENT ON TABLE instrument_types IS 'Tipos de instrumentos por categoría; requires_signatures indica si aplica recolección de firmas.';
