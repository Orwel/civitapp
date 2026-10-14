#!/usr/bin/env bash
# Conecta ESTE repo al proyecto Supabase de Civitapp vía Management API (HTTPS).
# No usa el conector MCP, así que no interfiere con otros proyectos (p. ej. Contrappto).
#
# Variables de entorno (nunca las pegues en un chat ni las subas al repo):
#   SUPABASE_ACCESS_TOKEN  Token personal: supabase.com/dashboard/account/tokens
#   CIVITAPP_PROJECT_REF   Ref del proyecto: lo que va antes de .supabase.co en NEXT_PUBLIC_SUPABASE_URL
#
# Uso:
#   scripts/supabase-civitapp.sh status                 # qué migraciones parecen aplicadas
#   scripts/supabase-civitapp.sh sql "select now()"     # consulta suelta
#   scripts/supabase-civitapp.sh sql -f archivo.sql     # ejecutar un archivo
#   scripts/supabase-civitapp.sh apply 036              # aplicar una migración (pide confirmación)
set -euo pipefail

API="https://api.supabase.com/v1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS="$ROOT/supabase/migrations"

die() { echo "error: $*" >&2; exit 1; }

: "${SUPABASE_ACCESS_TOKEN:?Falta SUPABASE_ACCESS_TOKEN}"
if [[ -z "${CIVITAPP_PROJECT_REF:-}" && -f "$ROOT/.env.local" ]]; then
  CIVITAPP_PROJECT_REF="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ROOT/.env.local" | sed -E 's#.*https://([a-z0-9]+)\.supabase\.co.*#\1#')"
fi
: "${CIVITAPP_PROJECT_REF:?Falta CIVITAPP_PROJECT_REF (o NEXT_PUBLIC_SUPABASE_URL en .env.local)}"
command -v jq >/dev/null || die "se necesita jq"

run_sql() {
  local query="$1"
  local body
  body="$(jq -n --arg q "$query" '{query: $q}')"
  local tmp status
  tmp="$(mktemp)"
  status="$(curl -sS -o "$tmp" -w '%{http_code}' -X POST \
    "$API/projects/$CIVITAPP_PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    --data-binary "$body")"
  if [[ "$status" != 2* ]]; then
    echo "HTTP $status" >&2
    cat "$tmp" >&2
    echo >&2
    rm -f "$tmp"
    return 1
  fi
  cat "$tmp"
  rm -f "$tmp"
}

# Cada migración relevante se reconoce por un objeto que crea (el proyecto no usa la tabla de historial de la CLI).
status() {
  local q
  q=$(cat <<'SQL'
select m.migration, m.applied from (values
  ('022 acciones constitucionales', to_regclass('public.constitutional_actions') is not null),
  ('023 profiles.role', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role')),
  ('025 borradores colaborativos', exists(select 1 from information_schema.columns where table_schema='public' and table_name='constitutional_actions' and column_name='draft_collaboration')),
  ('026 revisiones', to_regclass('public.constitutional_action_revisions') is not null),
  ('027 PDF y hash', exists(select 1 from information_schema.columns where table_schema='public' and table_name='constitutional_actions' and column_name='body_snapshot_sha256')),
  ('028 evidencia y reglas de cierre', exists(select 1 from information_schema.columns where table_schema='public' and table_name='constitutional_actions' and column_name='signature_close_rule')),
  ('032 onboarding', exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='onboarded_at')),
  ('034 idempotencia', exists(select 1 from information_schema.columns where table_schema='public' and table_name='constitutional_actions' and column_name='client_request_id')),
  ('035 firma en storage', exists(select 1 from pg_policies where schemaname='storage' and policyname='action_docs_signer_insert')),
  ('036 tipos configurables', to_regclass('public.action_type_milestones') is not null),
  ('bucket action_documents', exists(select 1 from storage.buckets where id='action_documents'))
) as m(migration, applied);
SQL
)
  run_sql "$q" | jq -r '.[] | "\(if .applied then "✔" else "✘" end)  \(.migration)"'
  echo
  run_sql "select count(*) as acciones, (select count(*) from constitutional_action_signatures) as firmas from constitutional_actions" 2>/dev/null \
    | jq -r '.[0] | "Acciones: \(.acciones) · Firmas: \(.firmas)"' || true
}

cmd="${1:-}"
shift || true
case "$cmd" in
  status)
    echo "Proyecto: $CIVITAPP_PROJECT_REF"
    status
    ;;
  sql)
    if [[ "${1:-}" == "-f" ]]; then
      [[ -f "${2:-}" ]] || die "no existe el archivo ${2:-}"
      run_sql "$(cat "$2")" | jq .
    else
      [[ -n "${1:-}" ]] || die 'uso: sql "select ..."'
      run_sql "$1" | jq .
    fi
    ;;
  apply)
    [[ -n "${1:-}" ]] || die "uso: apply 036"
    file="$(ls "$MIGRATIONS"/"$1"_*.sql 2>/dev/null | head -1)"
    [[ -n "$file" ]] || die "no encuentro la migración $1"
    echo "Vas a aplicar $(basename "$file") en el proyecto $CIVITAPP_PROJECT_REF."
    read -r -p "¿Continuar? (escribe 'si'): " ok
    [[ "$ok" == "si" ]] || die "cancelado"
    run_sql "$(cat "$file")" >/dev/null && echo "✔ aplicada $(basename "$file")"
    ;;
  *)
    sed -n '2,15p' "$0"
    exit 1
    ;;
esac
