"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, Loader2, Video } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { tapScale } from "@/components/motion-link";
import type { CaptureMethod } from "@/lib/types";

const CAPTURE_METHODS: { value: CaptureMethod; label: string; description: string }[] = [
  {
    value: "photo_360",
    label: "Simple 360° Photo Walkthrough",
    description: "Capture one 360°/wide photo per room. Fastest option, works everywhere.",
  },
  {
    value: "gaussian_splatting",
    label: "Gaussian Splatting",
    description: "Sweep each room on video for a photorealistic 3D reconstruction.",
  },
  { value: "nerf", label: "NeRF (Neural Radiance Fields)", description: "Video sweep per room, processed into a NeRF scene." },
  { value: "webxr", label: "WebXR Capture", description: "Browser-native AR-assisted room scan." },
  { value: "matterport", label: "Matterport-Compatible", description: "Capture with the Matterport app/camera, then link the finished scan." },
];

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  capturing: "Capturing Rooms",
  processing: "Processing 3D Reconstruction",
  ready: "Ready ✅",
  failed: "Failed",
};

/**
 * Camera-based 3D property tour capture wizard. Every published property
 * must have this completed (TourReady) before it can be submitted for admin
 * review — see property_review_handler.go's SubmitForReview gate.
 */
export default function TourCapturePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSceneType, setPendingSceneType] = useState<"photo_360" | "video_sweep">("photo_360");
  const [roomName, setRoomName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const { data: tour, isLoading } = useQuery({
    queryKey: ["tour", id],
    queryFn: () => api.tours.get(id),
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 5000 : false),
  });

  const startMutation = useMutation({
    mutationFn: (method: CaptureMethod) => api.tours.start(id, method),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tour", id] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.tours.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tour", id] }),
  });

  const submitForReviewMutation = useMutation({
    mutationFn: () => api.properties.submitForReview(id),
    onSuccess: () => router.push("/dashboard/properties"),
  });

  async function handleCapture(file: File) {
    if (!roomName.trim()) {
      setError("Enter a room name before capturing (e.g. Living Room, Master Bedroom).");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const mediaUrl = await uploadFile(file, `${roomName}-${file.name}`);
      await api.tours.addScene(id, { room_name: roomName, media_url: mediaUrl, scene_type: pendingSceneType });
      queryClient.invalidateQueries({ queryKey: ["tour", id] });
      setRoomName("");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) return <p className="text-white/50">Loading tour...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-white">3D Property Tour</h1>
      <p className="mt-1 text-white/50">
        Scan each room with your phone camera to create an interactive walkthrough buyers can
        explore right in their browser — no app install required.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80">
        Status: <span className="font-semibold text-teal-300">{STATUS_LABEL[tour?.status ?? "not_started"]}</span>
        {tour?.status === "processing" && <Loader2 size={14} className="animate-spin text-teal-300" />}
      </div>

      {(!tour || tour.status === "not_started") && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white">1. Choose a Capture Technology</h2>
          <div className="mt-4 space-y-3">
            {CAPTURE_METHODS.map((method) => (
              <motion.button
                key={method.value}
                {...tapScale}
                onClick={() => startMutation.mutate(method.value)}
                disabled={startMutation.isPending}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-teal-400/40 disabled:opacity-50"
              >
                <p className="font-medium text-white">{method.label}</p>
                <p className="mt-1 text-sm text-white/50">{method.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {tour && (tour.status === "capturing" || tour.status === "processing" || tour.status === "failed") && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white">2. Scan Each Room</h2>
          <p className="mt-1 text-sm text-white/50">
            Using method: <span className="text-white/80">{tour.capture_method.replace("_", " ")}</span>
          </p>

          <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div>
              <label className="text-xs font-medium text-white/50">Room Name</label>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Living Room"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingSceneType("photo_360")}
                className={`flex-1 rounded-full py-2 text-xs font-medium transition ${
                  pendingSceneType === "photo_360" ? "bg-teal-gradient text-charcoal-950" : "border border-white/15 text-white/60"
                }`}
              >
                360° Photo
              </button>
              <button
                type="button"
                onClick={() => setPendingSceneType("video_sweep")}
                className={`flex-1 rounded-full py-2 text-xs font-medium transition ${
                  pendingSceneType === "video_sweep" ? "bg-teal-gradient text-charcoal-950" : "border border-white/15 text-white/60"
                }`}
              >
                Video Sweep
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={pendingSceneType === "photo_360" ? "image/*" : "video/*"}
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCapture(file);
                e.target.value = "";
              }}
            />

            <motion.button
              type="button"
              {...tapScale}
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
            >
              {pendingSceneType === "photo_360" ? <Camera size={16} /> : <Video size={16} />}
              {uploading ? "Uploading..." : "Capture with Camera"}
            </motion.button>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          {tour.scenes && tour.scenes.length > 0 && (
            <div className="mt-4 space-y-2">
              {tour.scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm"
                >
                  <div className="flex items-center gap-2 text-white/80">
                    <CheckCircle2 size={15} className="text-teal-400" />
                    {scene.room_name}{" "}
                    <span className="text-white/40">
                      ({scene.scene_type === "photo_360" ? "360° photo" : "video sweep"})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tour.scenes && tour.scenes.length > 0 && tour.status !== "processing" && (
            <motion.button
              type="button"
              {...tapScale}
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="mt-4 w-full rounded-full border border-teal-400/40 py-3 text-sm font-semibold text-teal-300 disabled:opacity-50"
            >
              {completeMutation.isPending ? "Finishing..." : "Finish Capturing — Process Tour"}
            </motion.button>
          )}
        </div>
      )}

      {tour?.status === "ready" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <CheckCircle2 size={24} className="text-emerald-400" />
            <p className="text-white">Your 3D tour is ready! You can now submit this listing for review.</p>
          </div>
          <motion.button
            {...tapScale}
            onClick={() => submitForReviewMutation.mutate()}
            disabled={submitForReviewMutation.isPending}
            className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
          >
            {submitForReviewMutation.isPending ? "Submitting..." : "Submit Listing for Review"}
          </motion.button>
          {submitForReviewMutation.isError && (
            <p className="text-sm text-red-400">
              {submitForReviewMutation.error instanceof ApiError
                ? submitForReviewMutation.error.message
                : "Could not submit for review."}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

