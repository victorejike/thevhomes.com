"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Send, Wifi, WifiOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useChatSocket } from "@/lib/use-chat-socket";
import type { ChatMessage } from "@/lib/types";

function MessagesPageInner() {
  const { user, accessToken } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.conversations.list(),
    retry: false,
  });

  const { connected, liveMessages, sendMessage, sendTyping } = useChatSocket(accessToken);

  const activeConversation = conversations?.find((c) => c.id === activeConversationId);
  const recipientId = useMemo(() => {
    if (!activeConversation || !user) return null;
    return activeConversation.participant_one_id === user.id
      ? activeConversation.participant_two_id
      : activeConversation.participant_one_id;
  }, [activeConversation, user]);

  useEffect(() => {
    if (!activeConversationId) return;
    api.conversations
      .history(activeConversationId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [activeConversationId]);

  const messages = [
    ...history,
    ...liveMessages.filter((m) => m.conversation_id === activeConversationId),
  ];

  function handleSend() {
    if (!draft.trim() || !activeConversationId || !recipientId) return;
    sendMessage(activeConversationId, recipientId, draft.trim());
    setDraft("");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-white">Messages</h1>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            connected ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"
          }`}
        >
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
          {!conversations || conversations.length === 0 ? (
            <p className="p-4 text-sm text-white/50">
              No conversations yet. Message an agent from a property page to get started.
            </p>
          ) : (
            conversations.map((conv) => (
              <motion.button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                  activeConversationId === conv.id
                    ? "bg-teal-gradient text-charcoal-950"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                Conversation {conv.id.slice(0, 8)}
              </motion.button>
            ))
          )}
        </div>

        <div className="flex h-[520px] flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
          {!activeConversationId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-white/40">
              Select a conversation to start chatting.
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={m.sender_id === user?.id ? "text-right" : "text-left"}
                  >
                    <span
                      className={`inline-block max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.sender_id === user?.id
                          ? "bg-teal-gradient text-charcoal-950"
                          : "bg-white/10 text-white/90"
                      }`}
                    >
                      {m.content}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 p-3">
                <input
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (activeConversationId && recipientId) {
                      sendTyping(activeConversationId, recipientId);
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                <motion.button
                  onClick={handleSend}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-gradient text-charcoal-950"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}
