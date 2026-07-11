import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/Nav";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Client Login",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-4">
      <Wordmark className="mb-10" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
