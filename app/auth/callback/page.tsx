"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles } from "lucide-react";

import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("error_description") ?? params.get("error");
      if (authError) {
        if (active) setError(authError.replace(/\+/g, " "));
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await getSupabase().auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setError(exchangeError.message);
          return;
        }
      } else {
        const { data, error: sessionError } = await getSupabase().auth.getSession();
        if (sessionError || !data.session) {
          if (active) {
            setError(sessionError?.message ?? "The confirmation link is invalid or has expired.");
          }
          return;
        }
      }

      if (active) router.replace("/dashboard");
    }

    completeSignIn().catch((callbackError: unknown) => {
      if (active) {
        setError(
          callbackError instanceof Error
            ? callbackError.message
            : "Could not complete account confirmation.",
        );
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="auth-shell">
      <section className="auth-card text-center">
        <span className="brand-mark mx-auto mb-4"><Sparkles size={18} /></span>
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">
          {error ? "Confirmation link issue" : "Confirming your account"}
        </h1>
        {error ? (
          <>
            <p className="form-error mt-5" role="alert">{error}</p>
            <a className="button-primary mt-6" href="/login">Continue to sign in</a>
          </>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
            <LoaderCircle size={16} className="animate-spin" />
            Please wait while we finish setting up your account.
          </p>
        )}
      </section>
    </main>
  );
}
