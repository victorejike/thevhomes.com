"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFormShell } from "@/components/auth-form-shell";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function GoogleCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      setError("Missing Google sign-in code.");
      return;
    }

    api.auth
      .exchangeGoogleCode(code)
      .then((result) => {
        setSession(result.user, result.access_token, result.refresh_token);
        router.push("/dashboard");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Google sign-in failed. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthFormShell
      title={error ? "Sign-in Failed" : "Finishing sign-in..."}
      subtitle={error ? error : "Hang tight while we sign you in with Google."}
      footer={null}
    >
      {error ? (
        <button
          onClick={() => router.push("/login")}
          className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950"
        >
          Back to Sign In
        </button>
      ) : (
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      )}
    </AuthFormShell>
  );
}

export default function GoogleCompletePage() {
  return (
    <Suspense fallback={null}>
      <GoogleCompleteInner />
    </Suspense>
  );
}
