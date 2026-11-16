#!/usr/bin/env bash
# One-time copy of the database from the old hosted Supabase project into the
# VPS Postgres. Read-only on the source.
#
#   SOURCE_DB_URL  Supabase connection string (Project Settings → Database,
#                  "Session pooler" or direct), e.g. postgres://postgres.xxx:PW@...:5432/postgres
#   DATABASE_URL   the VPS database. Must already be migrated
#                  (node scripts/migrate.mjs) and hold no real data yet:
#                  every public table is EMPTIED before the copy.
#
# Needs psql + pg_dump at least as new as the source server (use postgres:17).
# Copies: logins (auth.users: ids, emails, bcrypt password hashes, names) and
# every row of every public table. Then prints row counts side by side.
set -euo pipefail
: "${SOURCE_DB_URL:?set SOURCE_DB_URL}" "${DATABASE_URL:?set DATABASE_URL}"
SRC="$SOURCE_DB_URL"; DST="$DATABASE_URL"
psql_dst() { psql "$DST" -v ON_ERROR_STOP=1 -q "$@"; }

tables=$(psql "$SRC" -Atc "select tablename from pg_tables where schemaname='public' order by 1")
missing=""
for t in $tables; do
  [ "$(psql "$DST" -Atc "select to_regclass('public.$t') is not null")" = "t" ] || missing="$missing $t"
done
if [ -n "$missing" ]; then echo "Tables in Supabase but not in the VPS schema:$missing"; exit 1; fi

echo "== emptying target tables"
psql_dst -c "truncate $(echo $tables | sed 's/ /, /g') cascade"
psql_dst -c "delete from auth.sessions; delete from auth.password_resets; delete from auth.users"

echo "== copying logins"
psql "$SRC" -c "\copy (select id, email, encrypted_password, coalesce(raw_user_meta_data, '{}'::jsonb), last_sign_in_at, created_at, coalesce(updated_at, created_at) from auth.users where email is not null) to stdout" \
  | psql_dst -c "alter table auth.users disable trigger on_auth_user_created" \
             -c "\copy auth.users (id, email, encrypted_password, raw_user_meta_data, last_sign_in_at, created_at, updated_at) from stdin" \
             -c "alter table auth.users enable trigger on_auth_user_created"

echo "== copying public tables"
pg_dump "$SRC" --data-only --schema=public --no-owner --no-privileges --disable-triggers \
  | grep -v '^SET transaction_timeout' \
  | psql_dst

echo "== row counts (supabase / vps)"
bad=0
for t in $tables; do
  a=$(psql "$SRC" -Atc "select count(*) from public.\"$t\"")
  b=$(psql "$DST" -Atc "select count(*) from public.\"$t\"")
  flag=""; [ "$a" = "$b" ] || { flag="  <-- MISMATCH"; bad=1; }
  printf "%-28s %8s %8s%s\n" "$t" "$a" "$b" "$flag"
done
a=$(psql "$SRC" -Atc "select count(*) from auth.users where email is not null")
b=$(psql "$DST" -Atc "select count(*) from auth.users")
printf "%-28s %8s %8s\n" "auth.users" "$a" "$b"
[ "$a" = "$b" ] || bad=1
[ $bad = 0 ] && echo "OK: everything matches" || { echo "Counts differ, see above"; exit 1; }
