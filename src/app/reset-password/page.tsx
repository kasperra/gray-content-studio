import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Wordmark } from "@/components/Nav";
import { dbConfigured } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Set a New Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  await connection();
  if (!dbConfigured()) redirect("/login?setup=1");

  // The recovery link (via /auth/confirm) has already established a session.
  const user = await currentUser();

  // No recovery session → the link was missing, expired, or already used.
  if (!user) redirect("/login?error=reset_expired");

  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-4">
      <Wordmark className="mb-10" />
      <UpdatePasswordForm email={user.email ?? ""} />
    </main>
  );
}
