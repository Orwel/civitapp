CREATE TYPE signature_close_rule AS ENUM ('DEADLINE_WINS', 'QUORUM_OR_DEADLINE', 'QUORUM_ONLY');

ALTER TABLE constitutional_actions
  ADD COLUMN IF NOT EXISTS signature_close_rule signature_close_rule NOT NULL DEFAULT 'QUORUM_OR_DEADLINE';

ALTER TABLE constitutional_action_signatures
  ADD COLUMN IF NOT EXISTS signer_geo_country text,
  ADD COLUMN IF NOT EXISTS signer_geo_region text,
  ADD COLUMN IF NOT EXISTS signer_geo_city text,
  ADD COLUMN IF NOT EXISTS signer_lat numeric,
  ADD COLUMN IF NOT EXISTS signer_lng numeric,
  ADD COLUMN IF NOT EXISTS signed_at_co_pretty text,
  ADD COLUMN IF NOT EXISTS signature_hash text,
  ADD COLUMN IF NOT EXISTS content_snapshot_sha256 text;

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
  END IF;

  IF OLD.state <> 'EN_CREACION' THEN
    NEW.content_body := OLD.content_body;
    NEW.content_data := OLD.content_data;
    NEW.content_pdf_storage_path := OLD.content_pdf_storage_path;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION evaluate_action_transitions(p_action_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r constitutional_actions%ROWTYPE;
  v_count int;
  v_from action_state;
BEGIN
  SELECT * INTO r FROM constitutional_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  v_from := r.state;
  v_count := action_signatures_count(p_action_id);

  IF r.state = 'EN_CREACION'
     AND r.publicacion_mode = 'SCHEDULED'
     AND r.publicacion_programada_at IS NOT NULL
     AND now() >= r.publicacion_programada_at THEN
    UPDATE constitutional_actions
    SET state = 'EN_FIRMA', firma_opened_at = now(), updated_at = now()
    WHERE id = p_action_id;
    PERFORM record_action_transition(p_action_id, v_from, 'EN_FIRMA', 'SCHEDULED', NULL, 'Publicación programada');
    RETURN;
  END IF;

  IF r.state = 'EN_FIRMA' THEN
    CASE r.signature_close_rule
      WHEN 'DEADLINE_WINS' THEN
        IF r.firma_deadline_at IS NOT NULL
           AND now() >= r.firma_deadline_at
           AND v_count >= r.minimum_required THEN
          UPDATE constitutional_actions SET state = 'FIRMADO', updated_at = now() WHERE id = p_action_id;
          PERFORM record_action_transition(p_action_id, v_from, 'FIRMADO', 'DEADLINE', NULL, 'Cierre por fecha límite');
        END IF;
      WHEN 'QUORUM_ONLY' THEN
        IF v_count >= r.minimum_required THEN
          UPDATE constitutional_actions SET state = 'FIRMADO', updated_at = now() WHERE id = p_action_id;
          PERFORM record_action_transition(p_action_id, v_from, 'FIRMADO', 'SIGNATURE_COUNT', NULL, 'Mínimo de firmas alcanzado');
        END IF;
      ELSE
        IF v_count >= r.minimum_required
           OR (
             r.firma_deadline_at IS NOT NULL
             AND now() >= r.firma_deadline_at
             AND v_count >= r.minimum_required
           ) THEN
          UPDATE constitutional_actions SET state = 'FIRMADO', updated_at = now() WHERE id = p_action_id;
          PERFORM record_action_transition(
            p_action_id, v_from, 'FIRMADO',
            CASE WHEN v_count >= r.minimum_required THEN 'SIGNATURE_COUNT'::transition_trigger_type ELSE 'DEADLINE'::transition_trigger_type END,
            NULL,
            'Cierre automático de recolección'
          );
        END IF;
    END CASE;
  END IF;
END;
$$;
