import { redirect } from "next/navigation";
import { createSupabaseServer, supabaseConfigured } from "./supabase/server";

export type SessionInfo = {
  userId: string;
  email: string | null;
  role: "admin" | "client";
  clientId: string | null;
  name: string | null;
};

/** Server-side session + profile lookup. Redirects to /login when unauthenticated. */
export async function requireUser(): Promise<SessionInfo> {
  if (!supabaseConfigured()) redirect("/login?setup=1");
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id, name")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: (profile?.role as "admin" | "client") ?? "client",
    clientId: profile?.client_id ?? null,
    name: profile?.name ?? null,
  };
}

/** Admin-only pages: bounce non-admins to the client portal. */
export async function requireAdmin(): Promise<SessionInfo> {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/portal");
  return session;
}
