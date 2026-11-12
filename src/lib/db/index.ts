import { connection } from "next/server";
import { sql, dbConfigured } from "./pool";
import { QueryBuilder, type Runner } from "./query";
import { currentUserId } from "@/lib/auth/session";

export { dbConfigured };
export type { DbResult, DbError } from "./query";

export type Db = { from: (table: string) => QueryBuilder };

/** Owner connection: bypasses Row Level Security. Server-only. Used for lead
    inserts from public forms, public proposal reads, cross-client lookups and
    privileged writes clients can't do themselves. */
export function adminDb(): Db {
  const run: Runner = (fn) => fn(sql());
  return { from: (table) => new QueryBuilder(run, table) };
}

/** Database access as a specific user (or anonymous when `userId` is null):
    every query runs in its own transaction under the `authenticated` / `anon`
    role with `app.user_id` set, so the RLS policies decide what it can see. */
export function dbAs(userId: string | null): Db {
  const run: Runner = (fn) =>
    sql().begin(async (tx) => {
      await tx`select set_config('role', ${userId ? "authenticated" : "anon"}, true),
                      set_config('app.user_id', ${userId ?? ""}, true)`;
      return fn(tx);
    }) as never;
  return { from: (table) => new QueryBuilder(run, table) };
}

/** Database access as the logged-in user of the current request (RLS applies). */
export async function userDb(): Promise<Db> {
  await connection(); // per-request: depends on the visitor's session
  return dbAs(await currentUserId());
}
