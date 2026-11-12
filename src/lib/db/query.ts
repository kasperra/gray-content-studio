/* eslint-disable @typescript-eslint/no-explicit-any */
import type postgres from "postgres";
import { sql } from "./pool";

/* A small query builder over plain Postgres.

   The app was written against a hosted backend's chainable query API
   (`db.from("projects").select("id, clients(company)").eq(...).order(...)`).
   This file keeps that calling style so the ~170 call sites read the same, but
   every query is compiled to ordinary SQL and run on our own Postgres:

   - Rows come back through `row_to_json`, so numbers, dates and jsonb have the
     same shapes the pages already expect (numeric → number, timestamptz → ISO
     string, date → "YYYY-MM-DD").
   - Writes go through `json_populate_record(set)`, which lets Postgres do every
     type conversion (uuid, enums, text[], jsonb) from the plain JS object.
   - Embedded relations (`clients(company)`) are resolved from the real foreign
     keys: a many-to-one becomes an object, a one-to-many an array.
   - Nothing throws. Every call resolves to `{ data, error, count }`.

   Only the subset of the API this app uses is implemented. Unknown tables or
   columns come back as an `error`, never as interpolated SQL. */

export type DbError = { message: string; code?: string; details?: string; hint?: string };
export type Row = Record<string, any>;
export type DbResult<T = Row[]> = { data: T | null; error: DbError | null; count: number | null };

/** Runs a callback against either the owner connection or a per-user transaction. */
export type Runner = <T>(fn: (q: postgres.Sql | postgres.TransactionSql) => Promise<T>) => Promise<T>;

// ---------- schema introspection (cached per process) ----------

type Fk = { table: string; col: string; ref: string; refCol: string };
type Schema = {
  columns: Map<string, Map<string, string>>; // table → column → sql type
  pk: Map<string, string[]>;
  fks: Fk[];
};

let schemaPromise: Promise<Schema> | null = null;

async function loadSchema(): Promise<Schema> {
  const db = sql();
  const cols = await db<{ t: string; c: string; ty: string }[]>`
    select c.relname as t, a.attname as c, format_type(a.atttypid, a.atttypmod) as ty
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'p')
      and a.attnum > 0 and not a.attisdropped`;
  const pks = await db<{ t: string; c: string }[]>`
    select c.relname as t, a.attname as c
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = k.conrelid and a.attnum = any(k.conkey)
    where n.nspname = 'public' and k.contype = 'p'`;
  const fks = await db<Fk[]>`
    select c.relname as table, a.attname as col, rc.relname as ref, ra.attname as "refCol"
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_class rc on rc.oid = k.confrelid
    join pg_namespace rn on rn.oid = rc.relnamespace
    join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
    join pg_attribute ra on ra.attrelid = k.confrelid and ra.attnum = k.confkey[1]
    where n.nspname = 'public' and rn.nspname = 'public' and k.contype = 'f'
      and array_length(k.conkey, 1) = 1
    order by k.conname`;

  const columns = new Map<string, Map<string, string>>();
  for (const r of cols) {
    if (!columns.has(r.t)) columns.set(r.t, new Map());
    columns.get(r.t)!.set(r.c, r.ty);
  }
  const pk = new Map<string, string[]>();
  for (const r of pks) pk.set(r.t, [...(pk.get(r.t) ?? []), r.c]);
  return { columns, pk, fks: [...fks] };
}

function schema(): Promise<Schema> {
  if (!schemaPromise) {
    schemaPromise = loadSchema().catch((e) => {
      schemaPromise = null; // retry on the next query
      throw e;
    });
  }
  return schemaPromise;
}

/** Forget the cached schema (used by tests after migrating). */
export function resetSchemaCache() {
  schemaPromise = null;
}

class QueryError extends Error {
  constructor(message: string, public code = "PGRST100") {
    super(message);
  }
}

const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`;

// ---------- select-list parsing ----------

type SelectItem = { kind: "star" } | { kind: "col"; name: string } | { kind: "embed"; name: string; items: SelectItem[] };

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function parseSelect(s: string): SelectItem[] {
  return splitTop(s).map((part) => {
    if (part === "*") return { kind: "star" } as const;
    const m = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*)\)$/);
    if (m) return { kind: "embed", name: m[1], items: parseSelect(m[2]) } as const;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part)) throw new QueryError(`Unsupported select item "${part}"`);
    return { kind: "col", name: part } as const;
  });
}

// ---------- the builder ----------

type Filter = (ctx: Ctx) => string;
type Ctx = { s: Schema; table: string; alias: string; params: unknown[] };

function colType(s: Schema, table: string, col: string): string {
  const t = s.columns.get(table);
  if (!t) throw new QueryError(`relation "public.${table}" does not exist`, "42P01");
  const ty = t.get(col);
  if (!ty) throw new QueryError(`column ${table}.${col} does not exist`, "42703");
  return ty;
}

function param(ctx: Ctx, v: unknown): string {
  ctx.params.push(v);
  return `$${ctx.params.length}`;
}

/** A filter value as a parameter cast to the column's own type. */
function typedParam(ctx: Ctx, col: string, v: unknown): string {
  const ty = colType(ctx.s, ctx.table, col);
  const text = typeof v === "object" ? JSON.stringify(v) : String(v);
  return `${param(ctx, text)}::text::${ty}`;
}

/** Build the select list for `table` aliased `alias`, recursing into embeds. */
function buildColumns(ctx: Ctx, items: SelectItem[], depth = 0): string {
  const { s, table, alias } = ctx;
  if (!s.columns.has(table)) throw new QueryError(`relation "public.${table}" does not exist`, "42P01");
  const parts: string[] = [];
  for (const it of items) {
    if (it.kind === "star") {
      for (const c of s.columns.get(table)!.keys()) parts.push(`${alias}.${q(c)}`);
    } else if (it.kind === "col") {
      colType(s, table, it.name);
      parts.push(`${alias}.${q(it.name)}`);
    } else {
      const child = `e${depth}_${parts.length}`;
      const inner = buildColumns({ ...ctx, table: it.name, alias: child }, it.items, depth + 1);
      const obj = `(select row_to_json(_r) from (select ${inner}) _r)`;
      // many-to-one: this table points at the embedded one → single object
      const up = s.fks.find((f) => f.table === table && f.ref === it.name);
      if (up) {
        parts.push(
          `(select ${obj} from public.${q(it.name)} ${child} where ${child}.${q(up.refCol)} = ${alias}.${q(up.col)}) as ${q(it.name)}`
        );
        continue;
      }
      // one-to-many: the embedded table points at this one → array
      const down = s.fks.find((f) => f.table === it.name && f.ref === table);
      if (down) {
        parts.push(
          `coalesce((select json_agg(${obj}) from public.${q(it.name)} ${child} where ${child}.${q(down.col)} = ${alias}.${q(down.refCol)}), '[]'::json) as ${q(it.name)}`
        );
        continue;
      }
      throw new QueryError(`Could not find a relationship between "${table}" and "${it.name}"`, "PGRST200");
    }
  }
  return parts.join(", ");
}

type Op = "select" | "insert" | "update" | "upsert" | "delete";

export class QueryBuilder<T = Row[]> implements PromiseLike<DbResult<T>> {
  private op: Op = "select";
  private selectList: string | null = null;
  private countMode: { head: boolean } | null = null;
  private filters: Filter[] = [];
  private orders: { col: string; asc: boolean; nullsFirst?: boolean }[] = [];
  private limitN: number | null = null;
  private singleMode: "single" | "maybe" | null = null;
  private values: Record<string, unknown>[] = [];
  private onConflict: string | null = null;
  private promise: Promise<DbResult<T>> | null = null;

  constructor(private run: Runner, private table: string) {}

  // ----- operations -----
  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    this.selectList = cols;
    if (opts?.count) this.countMode = { head: Boolean(opts.head) };
    return this;
  }
  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.values = Array.isArray(values) ? values : [values];
    return this;
  }
  upsert(values: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.values = Array.isArray(values) ? values : [values];
    this.onConflict = opts?.onConflict ?? null;
    return this;
  }
  update(values: Record<string, unknown>) {
    this.op = "update";
    this.values = [values];
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  // ----- filters -----
  eq(col: string, v: unknown) {
    this.filters.push((c) => (v === null ? `${c.alias}.${q(col)} is null` : `${c.alias}.${q(col)} = ${typedParam(c, col, v)}`));
    return this;
  }
  neq(col: string, v: unknown) {
    this.filters.push((c) => `${c.alias}.${q(col)} <> ${typedParam(c, col, v)}`);
    return this;
  }
  lt(col: string, v: unknown) {
    this.filters.push((c) => `${c.alias}.${q(col)} < ${typedParam(c, col, v)}`);
    return this;
  }
  lte(col: string, v: unknown) {
    this.filters.push((c) => `${c.alias}.${q(col)} <= ${typedParam(c, col, v)}`);
    return this;
  }
  gt(col: string, v: unknown) {
    this.filters.push((c) => `${c.alias}.${q(col)} > ${typedParam(c, col, v)}`);
    return this;
  }
  gte(col: string, v: unknown) {
    this.filters.push((c) => `${c.alias}.${q(col)} >= ${typedParam(c, col, v)}`);
    return this;
  }
  ilike(col: string, pattern: string) {
    this.filters.push((c) => {
      colType(c.s, c.table, col);
      return `${c.alias}.${q(col)}::text ilike ${param(c, pattern)}::text`;
    });
    return this;
  }
  in(col: string, vals: unknown[]) {
    this.filters.push((c) => {
      const ty = colType(c.s, c.table, col);
      const p = param(c, JSON.stringify(vals.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))));
      return `${c.alias}.${q(col)} in (select json_array_elements_text(${p}::text::json)::${ty})`;
    });
    return this;
  }
  is(col: string, v: null | boolean) {
    this.filters.push((c) => {
      colType(c.s, c.table, col);
      return `${c.alias}.${q(col)} is ${v === null ? "null" : v ? "true" : "false"}`;
    });
    return this;
  }
  not(col: string, op: "is" | "eq", v: unknown) {
    this.filters.push((c) => {
      if (op === "is") {
        colType(c.s, c.table, col);
        return `${c.alias}.${q(col)} is not ${v === null ? "null" : v ? "true" : "false"}`;
      }
      return `${c.alias}.${q(col)} is distinct from ${typedParam(c, col, v)}`;
    });
    return this;
  }
  match(obj: Record<string, unknown>) {
    for (const [k, v] of Object.entries(obj)) this.eq(k, v);
    return this;
  }
  /** PostgREST-style `a.eq.1,b.ilike.%x%,c.is.null`. */
  or(expr: string) {
    const terms = expr.split(/,(?=[a-zA-Z_][a-zA-Z0-9_]*\.(?:eq|neq|ilike|like|is|lt|lte|gt|gte)\.)/);
    this.filters.push((c) => {
      const parts = terms.map((t) => {
        const m = t.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.(eq|neq|ilike|like|is|lt|lte|gt|gte)\.([\s\S]*)$/);
        if (!m) throw new QueryError(`Unsupported or() term "${t}"`);
        const [, col, op, raw] = m;
        const ref = `${c.alias}.${q(col)}`;
        switch (op) {
          case "is":
            colType(c.s, c.table, col);
            return `${ref} is ${raw === "null" ? "null" : raw === "true" ? "true" : "false"}`;
          case "ilike":
          case "like":
            colType(c.s, c.table, col);
            return `${ref}::text ${op} ${param(c, raw.replace(/\*/g, "%"))}::text`;
          default: {
            const sym = { eq: "=", neq: "<>", lt: "<", lte: "<=", gt: ">", gte: ">=" }[op]!;
            return `${ref} ${sym} ${typedParam(c, col, raw)}`;
          }
        }
      });
      return `(${parts.join(" or ")})`;
    });
    return this;
  }

  // ----- modifiers -----
  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending ?? true, nullsFirst: opts?.nullsFirst });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single(): QueryBuilder<any> {
    this.singleMode = "single";
    return this as unknown as QueryBuilder<any>;
  }
  maybeSingle(): QueryBuilder<any> {
    this.singleMode = "maybe";
    return this as unknown as QueryBuilder<any>;
  }

  // ----- execution -----
  then<A = DbResult<T>, B = never>(
    onfulfilled?: ((value: DbResult<T>) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): Promise<A | B> {
    if (!this.promise) this.promise = this.execute();
    return this.promise.then(onfulfilled, onrejected);
  }

  private async execute(): Promise<DbResult<T>> {
    try {
      const s = await schema();
      if (!s.columns.has(this.table)) throw new QueryError(`relation "public.${this.table}" does not exist`, "42P01");
      const ctx: Ctx = { s, table: this.table, alias: "t0", params: [] };
      const text = this.compile(ctx);
      const rows = await this.run((db) => db.unsafe(text, ctx.params as any[]));
      return this.shape(rows as any[]);
    } catch (e: any) {
      return {
        data: null,
        count: null,
        error: { message: e?.message ?? String(e), code: e?.code, details: e?.detail, hint: e?.hint },
      };
    }
  }

  private where(ctx: Ctx): string {
    const parts = this.filters.map((f) => f(ctx));
    return parts.length ? ` where ${parts.join(" and ")}` : "";
  }

  private orderLimit(ctx: Ctx): string {
    let out = "";
    if (this.orders.length) {
      out +=
        " order by " +
        this.orders
          .map((o) => {
            colType(ctx.s, ctx.table, o.col);
            const nulls = o.nullsFirst === undefined ? "" : o.nullsFirst ? " nulls first" : " nulls last";
            return `${ctx.alias}.${q(o.col)} ${o.asc ? "asc" : "desc"}${nulls}`;
          })
          .join(", ");
    }
    if (this.limitN !== null) out += ` limit ${Math.max(0, Math.floor(this.limitN))}`;
    return out;
  }

  private compile(ctx: Ctx): string {
    const t = `public.${q(this.table)}`;
    const items = this.selectList !== null ? parseSelect(this.selectList) : null;

    if (this.op === "select") {
      if (this.countMode?.head) {
        return `select count(*)::int as "__count" from ${t} t0${this.where(ctx)}`;
      }
      const cols = buildColumns(ctx, items ?? [{ kind: "star" }]);
      const count = this.countMode ? `, count(*) over ()::int as "__count"` : "";
      return `select row_to_json(_x) as "__row"${count} from (select ${cols} from ${t} t0${this.where(ctx)}${this.orderLimit(ctx)}) _x`;
    }

    const returning = (from: string) =>
      items ? ` select row_to_json(_x) as "__row" from (select ${buildColumns({ ...ctx }, items)} from ${from} t0) _x` : ` select 1 as "__done" from ${from} limit 0`;

    if (this.op === "delete") {
      return `with _m as (delete from ${t} t0${this.where(ctx)} returning t0.*)${returning("_m")}`;
    }

    // insert / upsert / update: only the keys the caller set are written, so
    // column defaults still apply to everything else.
    const keys = [...new Set(this.values.flatMap((v) => Object.keys(v).filter((k) => v[k] !== undefined)))];
    for (const k of keys) colType(ctx.s, this.table, k);
    const clean = this.values.map((v) => Object.fromEntries(keys.map((k) => [k, v[k] === undefined ? null : v[k]])));
    const colList = keys.map(q).join(", ");

    if (this.op === "update") {
      if (!keys.length) throw new QueryError("update() needs at least one column");
      const p = param(ctx, JSON.stringify(clean[0]));
      const set = keys.map((k) => `${q(k)} = _v.${q(k)}`).join(", ");
      return `with _m as (update ${t} t0 set ${set} from json_populate_record(null::${t}, ${p}::text::json) _v${this.where(ctx)} returning t0.*)${returning("_m")}`;
    }

    const p = param(ctx, JSON.stringify(clean));
    let conflict = "";
    if (this.op === "upsert") {
      const target = this.onConflict ? this.onConflict.split(",").map((x) => x.trim()) : ctx.s.pk.get(this.table) ?? [];
      if (!target.length) throw new QueryError(`upsert on "${this.table}" needs a conflict target`);
      const updates = keys.filter((k) => !target.includes(k));
      conflict =
        ` on conflict (${target.map(q).join(", ")}) ` +
        (updates.length ? `do update set ${updates.map((k) => `${q(k)} = excluded.${q(k)}`).join(", ")}` : "do nothing");
    }
    const insert = keys.length
      ? `insert into ${t} (${colList}) select ${colList} from json_populate_recordset(null::${t}, ${p}::text::json)${conflict} returning *`
      : `insert into ${t} default values returning *`;
    return `with _m as (${insert})${returning("_m")}`;
  }

  private shape(rows: any[]): DbResult<T> {
    if (this.op === "select" && this.countMode?.head) {
      return { data: null, error: null, count: rows[0]?.__count ?? 0 };
    }
    const count = this.countMode ? (rows[0]?.__count ?? 0) : null;
    const isMutationWithoutSelect = this.op !== "select" && this.selectList === null;
    if (isMutationWithoutSelect) return { data: null, error: null, count };

    const data = rows.map((r) => r.__row);
    if (this.singleMode) {
      if (data.length === 1) return { data: data[0] as T, error: null, count };
      if (data.length === 0 && this.singleMode === "maybe") return { data: null, error: null, count };
      return {
        data: null,
        count,
        error: {
          code: "PGRST116",
          message: "JSON object requested, multiple (or no) rows returned",
          details: `The result contains ${data.length} rows`,
        },
      };
    }
    return { data: data as T, error: null, count };
  }
}
