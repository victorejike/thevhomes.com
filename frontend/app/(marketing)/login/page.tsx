"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AuthFormShell } from "@/components/auth-form-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { MotionLink } from "@/components/motion-link";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.auth.login({ email, password });
      setSession(result.user, result.access_token, result.refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not sign in. Is the API running? (See docs/DEPLOYMENT.md)"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Welcome Back"
      subtitle="Sign in to manage your properties, bookings, and messages."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <MotionLink
            href="/register"
            whileHover={{ scale: 1.05 }}
            className="inline-block font-medium text-teal-300 hover:text-teal-200"
          >
            Create one
          </MotionLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-white/50">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/50">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </motion.button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/40">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <GoogleAuthButton label="Sign in with Google" />
    </AuthFormShell>
  );
}
