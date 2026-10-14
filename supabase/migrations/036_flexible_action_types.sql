-- 036 — Tipos de acción configurables, hitos por tipo, términos en días hábiles,
-- firma simple con datos del firmante + autorización de datos, y endurecimiento de Storage.
-- Ver docs/adr/ADR-007-tipos-configurables.md

-- ========== 1. Configuración por tipo ==========
ALTER TABLE action_types
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'JUDICIAL'
    CHECK (category IN ('ADMINISTRATIVA', 'QUEJA', 'JUDICIAL')),
  -- Término de respuesta de la entidad (días hábiles desde el día siguiente a la radicación). NULL = sin término fijo.
  ADD COLUMN IF NOT EXISTS response_business_days int CHECK (response_business_days IS NULL OR response_business_days > 0),
  ADD COLUMN IF NOT EXISTS default_close_rule signature_close_rule NOT NULL DEFAULT 'QUORUM_OR_DEADLINE',
  -- SIMPLE: datos + autorización · DRAWN: además firma manuscrita en pantalla · VERIFIED: requiere identidad aprobada
  ADD COLUMN IF NOT EXISTS signature_level text NOT NULL DEFAULT 'DRAWN'
    CHECK (signature_level IN ('SIMPLE', 'DRAWN', 'VERIFIED')),
  -- {"cedula":"required","address":"required","phone":"optional","email":"required"} (omitido = no se pide)
  ADD COLUMN IF NOT EXISTS signer_fields jsonb NOT NULL DEFAULT '{"cedula":"required"}',
  -- Siguiente escalón sugerido cuando la acción no prospera (p. ej. petición → queja → acción popular)
  ADD COLUMN IF NOT EXISTS next_action_type_slug text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

UPDATE action_types SET response_business_days = 10 WHERE slug = 'accion_tutela';

INSERT INTO action_types (
  name, slug, competent_entity_hint, order_index, description, category,
  response_business_days, default_close_rule, signature_level, signer_fields, next_action_type_slug
) VALUES
  (
    'Derecho de petición', 'derecho_peticion', 'Entidad pública o particular que presta el servicio', 0,
    'Petición respetuosa a una autoridad o prestador (art. 23 C.P., Ley 1755 de 2015). Respuesta en 15 días hábiles.',
    'ADMINISTRATIVA', 15, 'DEADLINE_WINS', 'SIMPLE',
    '{"cedula":"required","address":"required","phone":"optional","email":"required"}',
    'queja_superservicios'
  ),
  (
    'Queja ante la Superservicios', 'queja_superservicios', 'Superintendencia de Servicios Públicos Domiciliarios', 0,
    'Queja ante la entidad de vigilancia y control del prestador de servicios públicos.',
    'QUEJA', 15, 'DEADLINE_WINS', 'SIMPLE',
    '{"cedula":"required","address":"required","phone":"optional","email":"required"}',
    'accion_popular'
  )
ON CONFLICT (slug) DO NOTHING;

UPDATE action_types SET order_index = 1 WHERE slug = 'queja_superservicios';

-- ========== 2. Hitos por tipo (reemplaza el uso del ENUM radicado_milestone en la UI) ==========
CREATE TABLE IF NOT EXISTS action_type_milestones (
  action_type_id uuid NOT NULL REFERENCES action_types(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  PRIMARY KEY (action_type_id, code)
);

ALTER TABLE action_type_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS action_type_milestones_select ON action_type_milestones;
CREATE POLICY action_type_milestones_select ON action_type_milestones FOR SELECT USING (true);
DROP POLICY IF EXISTS action_type_milestones_admin ON action_type_milestones;
CREATE POLICY action_type_milestones_admin ON action_type_milestones FOR ALL USING (is_admin());
GRANT SELECT ON action_type_milestones TO anon, authenticated;

INSERT INTO action_type_milestones (action_type_id, code, label, order_index)
SELECT t.id, m.code, m.label, m.ord
FROM action_types t
CROSS JOIN (VALUES
  ('RECIBIDA', 'Recibida', 1), ('ADMITIDA', 'Admitida', 2), ('INADMITIDA', 'Inadmitida', 3),
  ('EN_TRASLADO', 'En traslado', 4), ('EN_PRUEBAS', 'En pruebas', 5), ('EN_AUDIENCIA', 'En audiencia', 6),
  ('EN_DECISION', 'En decisión', 7), ('SENTENCIA', 'Sentencia', 8)
) AS m(code, label, ord)
WHERE t.category = 'JUDICIAL'
ON CONFLICT DO NOTHING;

INSERT INTO action_type_milestones (action_type_id, code, label, order_index)
SELECT t.id, m.code, m.label, m.ord
FROM action_types t
CROSS JOIN (VALUES
  ('RADICADA', 'Radicada', 1),
  ('TRASLADO_COMPETENCIA', 'Trasladada por competencia', 2),
  ('PRORROGA', 'Prórroga informada por la entidad', 3),
  ('RESPUESTA_DE_FONDO', 'Respondida de fondo', 4),
  ('RESPUESTA_INSUFICIENTE', 'Respuesta evasiva o incompleta', 5),
  ('VENCIDA_SIN_RESPUESTA', 'Vencida sin respuesta', 6)
) AS m(code, label, ord)
WHERE t.slug = 'derecho_peticion'
ON CONFLICT DO NOTHING;

INSERT INTO action_type_milestones (action_type_id, code, label, order_index)
SELECT t.id, m.code, m.label, m.ord
FROM action_types t
CROSS JOIN (VALUES
  ('RADICADA', 'Radicada', 1),
  ('EN_REVISION', 'En revisión', 2),
  ('REQUERIMIENTO_OPERADOR', 'Requerimiento al operador', 3),
  ('INVESTIGACION_ABIERTA', 'Investigación abierta', 4),
  ('RESPONDIDA', 'Respondida', 5),
  ('ARCHIVADA', 'Archivada', 6)
) AS m(code, label, ord)
WHERE t.slug = 'queja_superservicios'
ON CONFLICT DO NOTHING;

-- ========== 3. Días hábiles ==========
CREATE TABLE IF NOT EXISTS co_holidays (
  holiday_date date PRIMARY KEY,
  name text NOT NULL
);
ALTER TABLE co_holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS co_holidays_select ON co_holidays;
CREATE POLICY co_holidays_select ON co_holidays FOR SELECT USING (true);
GRANT SELECT ON co_holidays TO anon, authenticated;

-- Generado con: npx tsx scripts/generate-co-holidays.ts 2025 2030
INSERT INTO co_holidays (holiday_date, name) VALUES
  ('2025-01-01', 'Año Nuevo'),
  ('2025-01-06', 'Reyes Magos'),
  ('2025-03-24', 'San José'),
  ('2025-04-17', 'Jueves Santo'),
  ('2025-04-18', 'Viernes Santo'),
  ('2025-05-01', 'Día del Trabajo'),
  ('2025-06-02', 'Ascensión del Señor'),
  ('2025-06-23', 'Corpus Christi'),
  ('2025-06-30', 'Sagrado Corazón'),
  ('2025-07-20', 'Independencia'),
  ('2025-08-07', 'Batalla de Boyacá'),
  ('2025-08-18', 'Asunción de la Virgen'),
  ('2025-10-13', 'Día de la Raza'),
  ('2025-11-03', 'Todos los Santos'),
  ('2025-11-17', 'Independencia de Cartagena'),
  ('2025-12-08', 'Inmaculada Concepción'),
  ('2025-12-25', 'Navidad'),
  ('2026-01-01', 'Año Nuevo'),
  ('2026-01-12', 'Reyes Magos'),
  ('2026-03-23', 'San José'),
  ('2026-04-02', 'Jueves Santo'),
  ('2026-04-03', 'Viernes Santo'),
  ('2026-05-01', 'Día del Trabajo'),
  ('2026-05-18', 'Ascensión del Señor'),
  ('2026-06-08', 'Corpus Christi'),
  ('2026-06-15', 'Sagrado Corazón'),
  ('2026-06-29', 'San Pedro y San Pablo'),
  ('2026-07-20', 'Independencia'),
  ('2026-08-07', 'Batalla de Boyacá'),
  ('2026-08-17', 'Asunción de la Virgen'),
  ('2026-10-12', 'Día de la Raza'),
  ('2026-11-02', 'Todos los Santos'),
  ('2026-11-16', 'Independencia de Cartagena'),
  ('2026-12-08', 'Inmaculada Concepción'),
  ('2026-12-25', 'Navidad'),
  ('2027-01-01', 'Año Nuevo'),
  ('2027-01-11', 'Reyes Magos'),
  ('2027-03-22', 'San José'),
  ('2027-03-25', 'Jueves Santo'),
  ('2027-03-26', 'Viernes Santo'),
  ('2027-05-01', 'Día del Trabajo'),
  ('2027-05-10', 'Ascensión del Señor'),
  ('2027-05-31', 'Corpus Christi'),
  ('2027-06-07', 'Sagrado Corazón'),
  ('2027-07-05', 'San Pedro y San Pablo'),
  ('2027-07-20', 'Independencia'),
  ('2027-08-07', 'Batalla de Boyacá'),
  ('2027-08-16', 'Asunción de la Virgen'),
  ('2027-10-18', 'Día de la Raza'),
  ('2027-11-01', 'Todos los Santos'),
  ('2027-11-15', 'Independencia de Cartagena'),
  ('2027-12-08', 'Inmaculada Concepción'),
  ('2027-12-25', 'Navidad'),
  ('2028-01-01', 'Año Nuevo'),
  ('2028-01-10', 'Reyes Magos'),
  ('2028-03-20', 'San José'),
  ('2028-04-13', 'Jueves Santo'),
  ('2028-04-14', 'Viernes Santo'),
  ('2028-05-01', 'Día del Trabajo'),
  ('2028-05-29', 'Ascensión del Señor'),
  ('2028-06-19', 'Corpus Christi'),
  ('2028-06-26', 'Sagrado Corazón'),
  ('2028-07-03', 'San Pedro y San Pablo'),
  ('2028-07-20', 'Independencia'),
  ('2028-08-07', 'Batalla de Boyacá'),
  ('2028-08-21', 'Asunción de la Virgen'),
  ('2028-10-16', 'Día de la Raza'),
  ('2028-11-06', 'Todos los Santos'),
  ('2028-11-13', 'Independencia de Cartagena'),
  ('2028-12-08', 'Inmaculada Concepción'),
  ('2028-12-25', 'Navidad'),
  ('2029-01-01', 'Año Nuevo'),
  ('2029-01-08', 'Reyes Magos'),
  ('2029-03-19', 'San José'),
  ('2029-03-29', 'Jueves Santo'),
  ('2029-03-30', 'Viernes Santo'),
  ('2029-05-01', 'Día del Trabajo'),
  ('2029-05-14', 'Ascensión del Señor'),
  ('2029-06-04', 'Corpus Christi'),
  ('2029-06-11', 'Sagrado Corazón'),
  ('2029-07-02', 'San Pedro y San Pablo'),
  ('2029-07-20', 'Independencia'),
  ('2029-08-07', 'Batalla de Boyacá'),
  ('2029-08-20', 'Asunción de la Virgen'),
  ('2029-10-15', 'Día de la Raza'),
  ('2029-11-05', 'Todos los Santos'),
  ('2029-11-12', 'Independencia de Cartagena'),
  ('2029-12-08', 'Inmaculada Concepción'),
  ('2029-12-25', 'Navidad'),
  ('2030-01-01', 'Año Nuevo'),
  ('2030-01-07', 'Reyes Magos'),
  ('2030-03-25', 'San José'),
  ('2030-04-18', 'Jueves Santo'),
  ('2030-04-19', 'Viernes Santo'),
  ('2030-05-01', 'Día del Trabajo'),
  ('2030-06-03', 'Ascensión del Señor'),
  ('2030-06-24', 'Corpus Christi'),
  ('2030-07-01', 'Sagrado Corazón'),
  ('2030-07-20', 'Independencia'),
  ('2030-08-07', 'Batalla de Boyacá'),
  ('2030-08-19', 'Asunción de la Virgen'),
  ('2030-10-14', 'Día de la Raza'),
  ('2030-11-04', 'Todos los Santos'),
  ('2030-11-11', 'Independencia de Cartagena'),
  ('2030-12-08', 'Inmaculada Concepción'),
  ('2030-12-25', 'Navidad')
ON CONFLICT (holiday_date) DO NOTHING;

-- Último día del término: cuenta desde el día hábil siguiente a p_from.
CREATE OR REPLACE FUNCTION add_business_days(p_from date, p_days int)
RETURNS date
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  d date := p_from;
  remaining int := p_days;
BEGIN
  WHILE remaining > 0 LOOP
    d := d + 1;
    IF extract(isodow FROM d) < 6
       AND NOT EXISTS (SELECT 1 FROM co_holidays h WHERE h.holiday_date = d) THEN
      remaining := remaining - 1;
    END IF;
  END LOOP;
  RETURN d;
END;
$$;

-- ========== 4. Columnas nuevas en la acción ==========
ALTER TABLE constitutional_actions
  ADD COLUMN IF NOT EXISTS milestone_code text,
  ADD COLUMN IF NOT EXISTS response_due_on date;

-- Hitos existentes (ENUM) → milestone_code
UPDATE constitutional_actions
SET milestone_code = radicado_milestone::text
WHERE milestone_code IS NULL AND radicado_milestone IS NOT NULL;

CREATE OR REPLACE FUNCTION protect_action_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_action_leader(OLD.id) AND NOT is_admin() THEN
    NEW.state := OLD.state;
    NEW.visibility := OLD.visibility;
    NEW.minimum_required := OLD.minimum_required;
    NEW.firma_deadline_at := OLD.firma_deadline_at;
    NEW.action_type_id := OLD.action_type_id;
    NEW.draft_collaboration := OLD.draft_collaboration;
    NEW.created_by := OLD.created_by;
    NEW.signature_close_rule := OLD.signature_close_rule;
    NEW.content_pdf_storage_path := OLD.content_pdf_storage_path;
    NEW.milestone_code := OLD.milestone_code;
    NEW.response_due_on := OLD.response_due_on;
    NEW.radicado_at := OLD.radicado_at;
    NEW.final_document_storage_path := OLD.final_document_storage_path;
    NEW.final_document_sha256 := OLD.final_document_sha256;
  END IF;

  IF OLD.state <> 'EN_CREACION' THEN
    NEW.content_body := OLD.content_body;
    NEW.content_data := OLD.content_data;
    NEW.content_pdf_storage_path := OLD.content_pdf_storage_path;
  END IF;

  -- El documento final es inmutable una vez radicado
  IF OLD.state NOT IN ('EN_CREACION', 'EN_FIRMA', 'FIRMADO')
     AND OLD.final_document_storage_path IS NOT NULL THEN
    NEW.final_document_storage_path := OLD.final_document_storage_path;
    NEW.final_document_sha256 := OLD.final_document_sha256;
  END IF;

  RETURN NEW;
END;
$$;

-- ========== 5. Transiciones: radicación con fecha real, término y hitos por tipo ==========
DROP FUNCTION IF EXISTS transition_action_state(uuid, action_state, text, radicado_milestone, finalizado_result, text, text);

CREATE OR REPLACE FUNCTION transition_action_state(
  p_action_id uuid,
  p_to_state action_state,
  p_reason text DEFAULT NULL,
  p_radicado_milestone radicado_milestone DEFAULT NULL,
  p_finalizado_result finalizado_result DEFAULT NULL,
  p_radicado_number text DEFAULT NULL,
  p_radicado_entity_name text DEFAULT NULL,
  p_radicado_at timestamptz DEFAULT NULL,
  p_milestone_code text DEFAULT NULL
) RETURNS constitutional_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r constitutional_actions%ROWTYPE;
  t action_types%ROWTYPE;
  v_from action_state;
  v_radicado_at timestamptz;
  v_first_code text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT is_action_leader(p_action_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Action not found'; END IF;
  SELECT * INTO t FROM action_types WHERE id = r.action_type_id;
  v_from := r.state;

  IF p_to_state = 'EN_FIRMA' AND v_from = 'EN_CREACION' THEN
    UPDATE constitutional_actions SET
      state = 'EN_FIRMA',
      firma_opened_at = now(),
      updated_at = now()
    WHERE id = p_action_id;
  ELSIF p_to_state = 'FIRMADO' AND v_from = 'EN_FIRMA' THEN
    UPDATE constitutional_actions SET state = 'FIRMADO', updated_at = now() WHERE id = p_action_id;
  ELSIF p_to_state = 'RADICADO' AND v_from = 'FIRMADO' THEN
    v_radicado_at := COALESCE(p_radicado_at, now());
    IF v_radicado_at > now() + interval '1 hour' THEN
      RAISE EXCEPTION 'La fecha de radicación no puede ser futura';
    END IF;
    SELECT code INTO v_first_code
    FROM action_type_milestones
    WHERE action_type_id = r.action_type_id
    ORDER BY order_index
    LIMIT 1;
    UPDATE constitutional_actions SET
      state = 'RADICADO',
      radicado_milestone = CASE
        WHEN p_radicado_milestone IS NOT NULL THEN p_radicado_milestone
        WHEN t.category = 'JUDICIAL' THEN 'RECIBIDA'::radicado_milestone
        ELSE NULL
      END,
      milestone_code = COALESCE(p_milestone_code, p_radicado_milestone::text, v_first_code),
      radicado_at = v_radicado_at,
      response_due_on = CASE
        WHEN t.response_business_days IS NOT NULL
          THEN add_business_days((v_radicado_at AT TIME ZONE 'America/Bogota')::date, t.response_business_days)
        ELSE NULL
      END,
      radicado_number = p_radicado_number,
      radicado_entity_name = p_radicado_entity_name,
      updated_at = now()
    WHERE id = p_action_id;
  ELSIF p_to_state = 'FINALIZADO' THEN
    IF p_finalizado_result IS NULL THEN RAISE EXCEPTION 'finalizado_result required'; END IF;
    UPDATE constitutional_actions SET
      state = 'FINALIZADO',
      finalizado_result = p_finalizado_result,
      updated_at = now()
    WHERE id = p_action_id;
  ELSE
    UPDATE constitutional_actions SET
      state = p_to_state,
      radicado_milestone = COALESCE(p_radicado_milestone, radicado_milestone),
      milestone_code = COALESCE(p_milestone_code, p_radicado_milestone::text, milestone_code),
      updated_at = now()
    WHERE id = p_action_id;
  END IF;

  PERFORM record_action_transition(p_action_id, v_from, p_to_state, 'MANUAL', auth.uid(), p_reason);
  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id;
  RETURN r;
END;
$$;

-- Cambiar hito sin cambiar estado; valida que el hito exista para el tipo.
CREATE OR REPLACE FUNCTION set_action_milestone(p_action_id uuid, p_code text)
RETURNS constitutional_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r constitutional_actions%ROWTYPE;
  v_label text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT is_action_leader(p_action_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Action not found'; END IF;
  IF r.state NOT IN ('RADICADO', 'APELADO', 'EN_ESPERA_DE_OTRO_PROCESO') THEN
    RAISE EXCEPTION 'Solo se registran hitos después de radicar';
  END IF;

  SELECT label INTO v_label
  FROM action_type_milestones
  WHERE action_type_id = r.action_type_id AND code = p_code;
  IF v_label IS NULL THEN RAISE EXCEPTION 'Hito no válido para este tipo de acción'; END IF;

  UPDATE constitutional_actions SET
    milestone_code = p_code,
    radicado_milestone = CASE
      WHEN p_code = ANY (enum_range(NULL::radicado_milestone)::text[]) THEN p_code::radicado_milestone
      ELSE radicado_milestone
    END,
    updated_at = now()
  WHERE id = p_action_id;

  PERFORM record_action_transition(p_action_id, r.state, r.state, 'MANUAL', auth.uid(), 'Hito: ' || v_label);
  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id;
  RETURN r;
END;
$$;

-- ========== 6. Firmas: datos del firmante + autorización (Ley 1581 de 2012) ==========
ALTER TABLE constitutional_action_signatures
  ALTER COLUMN snapshot_signature_storage_path DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS signature_level text NOT NULL DEFAULT 'DRAWN',
  ADD COLUMN IF NOT EXISTS snapshot_address text,
  ADD COLUMN IF NOT EXISTS snapshot_phone text,
  ADD COLUMN IF NOT EXISTS snapshot_email text,
  ADD COLUMN IF NOT EXISTS data_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_consent_version text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION action_is_open_for_signing(p_action_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM constitutional_actions WHERE id = p_action_id AND state = 'EN_FIRMA'
  );
$$;

CREATE OR REPLACE FUNCTION action_is_public(p_action_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM constitutional_actions WHERE id = p_action_id AND visibility = 'PUBLIC'
  );
$$;

-- Una firma por cédula en cada acción (además de una por usuario)
CREATE UNIQUE INDEX IF NOT EXISTS uq_action_signatures_cedula
  ON constitutional_action_signatures (action_id, snapshot_cedula);

DROP POLICY IF EXISTS action_signatures_insert ON constitutional_action_signatures;
CREATE POLICY action_signatures_insert ON constitutional_action_signatures FOR INSERT WITH CHECK (
  signer_user_id = auth.uid() AND action_is_open_for_signing(action_id)
);

-- ========== 7. Storage action_documents ==========
-- Rutas: {actionId}/draft.pdf · {actionId}/signatures/{userId}.png · {actionId}/final/firmado.pdf
-- Antes: cualquiera podía leer imágenes de firma de acciones públicas y los firmantes no podían
-- subir su firma (foldername()[3] siempre es NULL porque foldername excluye el archivo).

CREATE OR REPLACE FUNCTION storage_action_id(p_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ((storage.foldername(p_name))[1])::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

DROP POLICY IF EXISTS action_docs_read ON storage.objects;
CREATE POLICY action_docs_read ON storage.objects FOR SELECT
USING (
  bucket_id = 'action_documents'
  AND (
    is_action_leader(storage_action_id(name))
    OR is_admin()
    -- Firma propia
    OR (
      (storage.foldername(name))[2] = 'signatures'
      AND storage.filename(name) = auth.uid()::text || '.png'
    )
    -- Documento base (no firmas, no documento final con datos de todos)
    OR (
      coalesce((storage.foldername(name))[2], '') NOT IN ('signatures', 'final')
      AND (action_is_public(storage_action_id(name)) OR is_action_signer(storage_action_id(name)))
    )
  )
);

DROP POLICY IF EXISTS action_docs_signer_insert ON storage.objects;
CREATE POLICY action_docs_signer_insert ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'action_documents'
  AND (storage.foldername(name))[2] = 'signatures'
  AND auth.uid() IS NOT NULL
  AND storage.filename(name) = auth.uid()::text || '.png'
  AND action_is_open_for_signing(storage_action_id(name))
);

DROP POLICY IF EXISTS action_docs_signer_update ON storage.objects;
CREATE POLICY action_docs_signer_update ON storage.objects FOR UPDATE
USING (
  bucket_id = 'action_documents'
  AND (storage.foldername(name))[2] = 'signatures'
  AND storage.filename(name) = auth.uid()::text || '.png'
  AND action_is_open_for_signing(storage_action_id(name))
)
WITH CHECK (
  bucket_id = 'action_documents'
  AND (storage.foldername(name))[2] = 'signatures'
  AND storage.filename(name) = auth.uid()::text || '.png'
  AND action_is_open_for_signing(storage_action_id(name))
);

-- ========== 8. Vista pública: hito, radicación, vencimiento y documento publicado ==========
-- DROP + CREATE: la 024 depende de columnas de la 027 y pudo quedar aplicada o no según el orden real.
DROP VIEW IF EXISTS constitutional_actions_public;
CREATE VIEW constitutional_actions_public AS
SELECT
  a.id,
  a.slug,
  a.action_type_id,
  a.title,
  a.summary,
  a.state,
  a.radicado_milestone,
  a.finalizado_result,
  a.minimum_required,
  a.target_count,
  a.firma_deadline_at,
  a.visibility,
  a.created_at,
  a.body_snapshot_sha256,
  a.final_document_sha256,
  (SELECT count(*)::int FROM constitutional_action_signatures s WHERE s.action_id = a.id) AS signatures_count,
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('full_name', p.full_name, 'role', r.role)
      ORDER BY
        CASE r.role
          WHEN 'CREADOR' THEN 1
          WHEN 'LIDER' THEN 2
          WHEN 'CO_LIDER' THEN 3
          ELSE 4
        END,
        p.full_name
    ), '[]'::jsonb)
    FROM (
      SELECT r.role, r.user_id
      FROM constitutional_action_roles r
      WHERE r.action_id = a.id AND r.role IN ('CREADOR', 'LIDER', 'CO_LIDER')
      LIMIT 5
    ) r
    JOIN profiles p ON p.id = r.user_id
  ) AS leaders,
  a.milestone_code,
  a.radicado_at,
  a.response_due_on,
  -- El documento es público una vez publicado (la petición debe poder leerse sin cuenta)
  a.content_mode,
  CASE WHEN a.state <> 'EN_CREACION' THEN a.content_body END AS content_body,
  CASE WHEN a.state <> 'EN_CREACION' THEN a.content_pdf_storage_path END AS content_pdf_storage_path
FROM constitutional_actions a
WHERE a.visibility = 'PUBLIC';

GRANT SELECT ON constitutional_actions_public TO anon, authenticated;
