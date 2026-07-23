"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import type { Property } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { MotionLink } from "./motion-link";

interface ChatEntry {
  role: "user" | "assistant";
  text: string;
  matches?: Property[];
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([
    {
      role: "assistant",
      text: "Hi! I'm the TheVHomes AI assistant. Try asking me something like \"Find me a 4 bedroom house in Abuja under 100 million\".",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, open]);

  async function handleSend() {
    const message = input.trim();
    if (!message || loading) return;

    setHistory((h) => [...h, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const result = await api.ai.ask(message);
      setHistory((h) => [
        ...h,
        { role: "assistant", text: result.reply, matches: result.matches?.slice(0, 3) },
      ]);
    } catch {
      setHistory((h) => [
        ...h,
        { role: "assistant", text: "Sorry, I couldn't process that just now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={open ? {} : { scale: [1, 1.06, 1] }}
        transition={open ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-gradient text-charcoal-950 shadow-glow transition hover:brightness-110"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-charcoal-900/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 border-b border-white/10 bg-teal-gradient px-4 py-3 text-charcoal-950">
              <Bot size={18} />
              <span className="font-display text-sm font-semibold">
                TheVHomes AI Assistant
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {history.map((entry, i) => (
                <div key={i} className={entry.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                      entry.role === "user"
                        ? "bg-teal-gradient text-charcoal-950"
                        : "bg-white/10 text-white/90"
                    }`}
                  >
                    {entry.text}
                  </div>

                  {entry.matches && entry.matches.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {entry.matches.map((p) => (
                        <MotionLink
                          key={p.id}
                          href={`/properties/${p.slug}`}
                          whileHover={{ scale: 1.02, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition hover:border-teal-400/40"
                        >
                          <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={
                                p.images?.[0]?.url ??
                                "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=60"
                              }
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white">{p.title}</p>
                            <p className="text-xs text-teal-300">
                              {formatPrice(p.price, p.currency)}
                            </p>
                          </div>
                        </MotionLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="inline-block rounded-2xl bg-white/10 px-3.5 py-2 text-sm text-white/60">
                  Thinking...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-white/10 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about a property..."
                className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <motion.button
                onClick={handleSend}
                disabled={loading}
                aria-label="Send"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-gradient text-charcoal-950 disabled:opacity-50"
              >
                <Send size={15} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
