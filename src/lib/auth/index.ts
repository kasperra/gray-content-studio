import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminDb, dbConfigured } from "@/lib/db";
import { currentUser } from "./session";

export type SessionInfo = {
  userId: string;
  email: string | null;
  role: "admin" | "client";
  clientId: string | null;
  name: string | null;
};

/** Session + profile for the current request, or null when not logged in. */
export async function getSession(): Promise<SessionInfo | null> {
  // Per-request, never prerendered at build time (where there's no database).
  await connection();
  if (!dbConfigured()) return null;
  const user = await currentUser();
  if (!user) return null;
  const { data: profile } = await adminDb()
    .from("profiles")
    .select("role, client_id, name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    userId: user.id,
    email: user.email ?? null,
    role: (profile?.role as "admin" | "client") ?? "client",
    clientId: profile?.client_id ?? null,
    name: profile?.name ?? null,
  };
}

/** Server-side session + profile lookup. Redirects to /login when unauthenticated. */
export async function requireUser(): Promise<SessionInfo> {
  await connection();
  if (!dbConfigured()) redirect("/login?setup=1");
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Admin-only pages: bounce non-admins to the client portal. */
export async function requireAdmin(): Promise<SessionInfo> {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/portal");
  return session;
}
