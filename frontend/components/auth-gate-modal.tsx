"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { GoogleAuthButton } from "./google-auth-button";

/**
 * A focused sign-in/sign-up modal used to gate premium features (like the
 * interactive 3D tour) without navigating the visitor away from the page
 * they're on. On success it calls `onAuthenticated` so the caller can
 * immediately resume whatever the visitor was trying to do (e.g. open the
 * 3D viewer) on the very same page.
 */
export function AuthGateModal({
  message,
  onClose,
  onAuthenticated,
}: {
  message: string;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result =
        mode === "login"
          ? await api.auth.login({ email: form.email, password: form.password })
          : await api.auth.register({
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
              role: "customer",
            });
      setSession(result.user, result.access_token, result.refresh_token);
      onAuthenticated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-charcoal-900 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/10 text-teal-300">
              <Lock size={16} />
            </span>
            <h3 id="auth-gate-title" className="font-display text-lg font-semibold text-white">
              {mode === "login" ? "Sign In Required" : "Create Your Account"}
            </h3>
          </div>
          <motion.button
            ref={closeButtonRef}
            onClick={onClose}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.85 }}
            aria-label="Close"
            className="text-white/60 hover:text-white"
          >
            <X size={18} />
          </motion.button>
        </div>

        <p className="mt-3 text-sm text-white/60">{message}</p>

        <div className="mt-5 flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`flex-1 rounded-full py-2 text-xs font-medium capitalize transition ${
                mode === m ? "bg-teal-gradient text-charcoal-950" : "text-white/60"
              }`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === "register" && (
            <div>
              <label className="text-xs font-medium text-white/50">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          )}
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
          {mode === "register" && (
            <div>
              <label className="text-xs font-medium text-white/50">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-white/50">Password</label>
            <input
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
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
            {loading ? "Please wait..." : mode === "login" ? "Sign In & Continue" : "Create Account & Continue"}
          </motion.button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <GoogleAuthButton label={mode === "login" ? "Sign in with Google" : "Sign up with Google"} />
      </motion.div>
    </div>
  );
}
