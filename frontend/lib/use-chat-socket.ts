"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./api";
import type { ChatMessage } from "./types";

interface TypingEvent {
  conversation_id: string;
  user_id: string;
}

/**
 * Connects to the backend's real-time chat WebSocket
 * (GET /api/v1/ws/chat?token=...) and exposes send/typing helpers plus
 * live message + typing state. Falls back to a disconnected state (with
 * `connected: false`) when the API is unreachable, so the UI can show
 * "connecting..." instead of crashing.
 */
export function useChatSocket(accessToken: string | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [typingFrom, setTypingFrom] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const wsUrl = `${API_BASE_URL.replace(/^http/, "ws")}/ws/chat?token=${accessToken}`;
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
    } catch {
      return;
    }

    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; payload: unknown };
        if (parsed.type === "message") {
          setLiveMessages((prev) => [...prev, parsed.payload as ChatMessage]);
        } else if (parsed.type === "typing") {
          const typing = parsed.payload as TypingEvent;
          setTypingFrom(typing.user_id);
          setTimeout(() => setTypingFrom(null), 2000);
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => socket.close();
  }, [accessToken]);

  const sendMessage = useCallback(
    (conversationId: string, recipientId: string, content: string) => {
      socketRef.current?.send(
        JSON.stringify({
          type: "message",
          conversation_id: conversationId,
          recipient_id: recipientId,
          content,
        })
      );
    },
    []
  );

  const sendTyping = useCallback((conversationId: string, recipientId: string) => {
    socketRef.current?.send(
      JSON.stringify({ type: "typing", conversation_id: conversationId, recipient_id: recipientId })
    );
  }, []);

  return { connected, liveMessages, typingFrom, sendMessage, sendTyping };
}
