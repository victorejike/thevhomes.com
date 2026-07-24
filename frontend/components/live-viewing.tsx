"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useChatSocket } from "@/lib/use-chat-socket";
import { api } from "@/lib/api";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

/**
 * Live Video Property Tour: a peer-to-peer WebRTC HD video call between the
 * customer and agent. Signaling (SDP offer/answer, ICE candidates) rides
 * the existing chat WebSocket — see backend message_handler.go's
 * "webrtc_*" event types — so no separate signaling server is needed.
 */
export function LiveViewing({
  bookingId,
  sessionToken,
  remoteUserId,
}: {
  bookingId: string;
  sessionToken: string;
  remoteUserId: string;
}) {
  const { accessToken, user } = useAuthStore();
  const { connected, sendSignal, lastSignal } = useChatSocket(accessToken);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [callState, setCallState] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState("");

  function ensurePeerConnection() {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal("webrtc_ice_candidate", remoteUserId, sessionToken, e.candidate);
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setCallState("live");
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") setCallState("ended");
    };

    pcRef.current = pc;
    return pc;
  }

  async function getLocalStream() {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }

  async function startCall() {
    setError("");
    setCallState("connecting");
    try {
      const stream = await getLocalStream();
      const pc = ensurePeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal("webrtc_offer", remoteUserId, sessionToken, offer);
      await api.liveSessions.start(sessionToken).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not access your camera/microphone.");
      setCallState("idle");
    }
  }

  async function handleIncomingOffer(offer: RTCSessionDescriptionInit) {
    setCallState("connecting");
    try {
      const stream = await getLocalStream();
      const pc = ensurePeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal("webrtc_answer", remoteUserId, sessionToken, answer);
      await api.liveSessions.start(sessionToken).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not answer the call.");
    }
  }

  useEffect(() => {
    if (!lastSignal || lastSignal.session_token !== sessionToken) return;

    (async () => {
      const pc = ensurePeerConnection();
      switch (lastSignal.type) {
        case "webrtc_offer":
          await handleIncomingOffer(lastSignal.signal as RTCSessionDescriptionInit);
          break;
        case "webrtc_answer":
          await pc.setRemoteDescription(new RTCSessionDescription(lastSignal.signal as RTCSessionDescriptionInit));
          break;
        case "webrtc_ice_candidate":
          try {
            await pc.addIceCandidate(new RTCIceCandidate(lastSignal.signal as RTCIceCandidateInit));
          } catch {
            // ICE candidates that arrive before the remote description is set are safely dropped.
          }
          break;
        case "webrtc_hangup":
          endCall(false);
          break;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSignal]);

  function toggleMic() {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((v) => !v);
  }
  function toggleCam() {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn((v) => !v);
  }

  function endCall(notifyPeer = true) {
    if (notifyPeer) sendSignal("webrtc_hangup", remoteUserId, sessionToken, null);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setCallState("ended");
    api.liveSessions.end(sessionToken).catch(() => {});
  }

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-charcoal-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">
          Live Video Tour · Booking #{bookingId.slice(0, 8)}
        </p>
        <span className={`text-xs ${connected ? "text-emerald-400" : "text-white/40"}`}>
          {connected ? "Signaling connected" : "Connecting..."}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
            Remote
          </span>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
          <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
            {user?.name ?? "You"}
          </span>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex items-center justify-center gap-3">
        {callState === "idle" || callState === "ended" ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startCall}
            className="rounded-full bg-teal-gradient px-6 py-2.5 text-sm font-semibold text-charcoal-950"
          >
            {callState === "ended" ? "Call Again" : "Start Call"}
          </motion.button>
        ) : (
          <>
            <IconButton onClick={toggleMic} active={micOn} icon={micOn ? Mic : MicOff} />
            <IconButton onClick={toggleCam} active={camOn} icon={camOn ? Video : VideoOff} />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => endCall(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white"
              aria-label="End call"
            >
              <PhoneOff size={18} />
            </motion.button>
          </>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-white/40 capitalize">{callState}</p>
    </div>
  );
}

function IconButton({
  onClick,
  active,
  icon: Icon,
}: {
  onClick: () => void;
  active: boolean;
  icon: typeof Mic;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full border ${
        active ? "border-white/20 text-white" : "border-red-500/40 bg-red-500/10 text-red-300"
      }`}
    >
      <Icon size={17} />
    </motion.button>
  );
}
