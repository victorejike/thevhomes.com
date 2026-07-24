"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFormShell } from "@/components/auth-form-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { MotionLink } from "@/components/motion-link";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "agent" ? "agent" : "customer";

  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: defaultRole as "customer" | "agent",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.auth.register(form);
      setSession(result.user, result.access_token, result.refresh_token);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create your account. Is the API running? (See docs/DEPLOYMENT.md)"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Create Your Account"
      subtitle="Join TheVHomes to save properties, book viewings, and more."
      footer={
        <>
          Already have an account?{" "}
          <MotionLink
            href="/login"
            whileHover={{ scale: 1.05 }}
            className="inline-block font-medium text-teal-300 hover:text-teal-200"
          >
            Sign in
          </MotionLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          {(["customer", "agent"] as const).map((role) => (
            <motion.button
              type="button"
              key={role}
              onClick={() => setForm((f) => ({ ...f, role }))}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition ${
                form.role === role ? "bg-teal-gradient text-charcoal-950" : "text-white/60"
              }`}
            >
              {role === "customer" ? "I'm a Buyer/Renter" : "I'm an Agent"}
            </motion.button>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-white/50">Full Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/50">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/50">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/50">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
          {loading ? "Creating account..." : "Create Account"}
        </motion.button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/40">OR</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <GoogleAuthButton label="Sign up with Google" />

      <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
        After signing up, you&apos;ll be asked to verify your identity with your NIN
        (National Identification Number) via VerifyMe for full platform access.
      </p>
    </AuthFormShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterFormInner />
    </Suspense>
  );
}
