import { sql } from "@/lib/db/pool";
import { hashPassword } from "./session";

/** Create a login. The `on_auth_user_created` trigger creates its profile. */
export async function createUser(input: {
  email: string;
  password: string;
  name?: string | null;
}): Promise<{ id: string; error: null } | { id: null; error: string }> {
  const email = input.email.trim().toLowerCase();
  const hash = await hashPassword(input.password);
  try {
    const rows = await sql()<{ id: string }[]>`
      insert into auth.users (email, encrypted_password, raw_user_meta_data)
      values (${email}, ${hash}, ${sql().json({ name: input.name ?? email })})
      returning id`;
    return { id: rows[0].id, error: null };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    return { id: null, error: code === "23505" ? "A user with this email has already been registered" : String(e) };
  }
}

/** Delete a login (its profile and sessions cascade). */
export async function deleteUser(id: string): Promise<void> {
  await sql()`delete from auth.users where id = ${id}`;
}
