"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

/** In-app notification inbox (bell icon): verification approved/rejected,
 * agent approved, booking confirmed, payment successful, viewing reminder,
 * listing approved/rejected, etc. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: () => api.notifications.listMine(),
    retry: false,
    refetchInterval: 30_000,
  });

  async function markAllRead() {
    await api.notifications.markAllRead().catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["notifications", "me"] });
  }

  const unread = data?.unread_count ?? 0;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-400 px-1 text-[10px] font-bold text-charcoal-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-white/10 bg-charcoal-900 p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-semibold text-white">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-teal-300 hover:text-teal-200">
                  Mark all read
                </button>
              )}
            </div>
            <div className="mt-1 max-h-80 space-y-1 overflow-y-auto">
              {!data || data.items.length === 0 ? (
                <p className="p-4 text-center text-sm text-white/40">No notifications yet.</p>
              ) : (
                data.items.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl p-3 text-sm transition ${
                      n.read_at ? "text-white/50" : "bg-white/5 text-white"
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-white/50">{n.body}</p>
                    <p className="mt-1 text-[10px] text-white/30">{formatDate(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
