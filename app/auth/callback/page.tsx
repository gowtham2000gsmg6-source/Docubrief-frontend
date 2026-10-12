"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles } from "lucide-react";

import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [recoveryFlow, setRecoveryFlow] = useState(false);

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") === "/reset-password" ? "/reset-password" : "/dashboard";
      if (active) setRecoveryFlow(next === "/reset-password");
      const authError = params.get("error_description") ?? params.get("error");
      if (authError) {
        if (active) setError(authError.replace(/\+/g, " "));
        return;
      }

      const supabase = getSupabase();
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setError(exchangeError.message);
          return;
        }
      } else {
        const tokenHash = params.get("token_hash");
        const otpType = params.get("type");
        if (
          tokenHash &&
          (otpType === "recovery" || otpType === "signup")
        ) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (verifyError) {
            if (active) setError(verifyError.message);
            return;
          }
        } else {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              if (active) setError(sessionError.message);
              return;
            }
          } else {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !data.session) {
              if (active) {
                setError(sessionError?.message ?? "The confirmation link is invalid or has expired.");
              }
              return;
            }
          }
        }
      }

      if (active) router.replace(next);
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
          {error ? "Authentication link issue" : "Verifying your link"}
        </h1>
        {error ? (
          <>
            <p className="form-error mt-5" role="alert">{error}</p>
            <a className="button-primary mt-6" href={recoveryFlow ? "/forgot-password" : "/login"}>
              {recoveryFlow ? "Request another reset link" : "Continue to sign in"}
            </a>
          </>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
            <LoaderCircle size={16} className="animate-spin" />
            Please wait while we verify your link.
          </p>
        )}
      </section>
    </main>
  );
}
