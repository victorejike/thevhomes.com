"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";

/**
 * "Continue with Google" / "Sign in with Google" / "Sign up with Google" —
 * all three are the same OAuth redirect flow; only the label differs by
 * context. Clicking asks the backend for the Google consent URL, then
 * navigates the browser there. Google redirects back to
 * /auth/google/callback (handled by the backend), which itself redirects to
 * /auth/google/complete on the frontend with a short-lived exchange result.
 */
export function GoogleAuthButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const { auth_url } = await api.auth.googleAuthUrl();
      window.location.href = auth_url;
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof ApiError
          ? err.message
          : "Google sign-in is not configured yet. Set GOOGLE_OAUTH_CLIENT_ID/SECRET on the backend."
      );
    }
  }

  return (
    <div>
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-50"
      >
        <GoogleGlyph />
        {loading ? "Redirecting to Google..." : label}
      </motion.button>
      {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.9 4.5 4 13.4 4 24.5s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.5c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.6 2.4-7.7 2.4-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.9 16.2 44.5 24 44.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.6 5.6C41.6 35.9 44 30.6 44 24.5c0-1.3-.1-2.7-.4-4z"
      />
    </svg>
  );
}
