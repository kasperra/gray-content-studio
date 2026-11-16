import postgres from "postgres";

/* One connection pool per server process. DATABASE_URL points at the Postgres
   on the VPS. The pool is created lazily so a build without the variable (and
   pages that never touch the database) still work. */

declare global {
  // Reused across hot reloads in dev so connections don't pile up.
  var __gcsSql: postgres.Sql | undefined;
}

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function sql(): postgres.Sql {
  if (!globalThis.__gcsSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalThis.__gcsSql = postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idle_timeout: 30,
      // Notices (e.g. "relation already exists, skipping") aren't errors.
      onnotice: () => {},
    });
  }
  return globalThis.__gcsSql;
}
