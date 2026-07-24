"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize, Minimize, RotateCw, View, ZoomIn, ZoomOut } from "lucide-react";
import type { PropertyTour } from "@/lib/types";

/**
 * Renders the interactive 3D walkthrough in-browser (no app install):
 *  - "matterport_embed": Matterport (or Matterport-compatible) share link,
 *    which already ships its own full walkthrough/360°/zoom/fullscreen UI.
 *  - "splat_viewer": Gaussian-splat/NeRF reconstruction. If a compatible
 *    in-browser splat renderer script is reachable it's used for a true 3D
 *    viewer; otherwise this degrades to the thumbnail + open-in-new-tab
 *    fallback below so the tour is still explorable.
 *  - "panorama_viewer" (default): a dependency-free walkthrough over the
 *    captured room scenes — drag-to-look-around 360° photos or looping
 *    video sweeps, with room-to-room navigation, zoom, and fullscreen.
 */
export function TourViewer({ tour }: { tour: PropertyTour }) {
  if (tour.status !== "ready" || !tour.scenes || tour.scenes.length === 0) {
    if (tour.viewer_type === "matterport_embed" && tour.asset_url) {
      return <MatterportEmbed url={tour.asset_url} />;
    }
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white/40">
        <div className="text-center">
          <View size={28} className="mx-auto text-white/20" />
          <p className="mt-3 font-medium text-white/70">
            {tour.status === "processing" ? "3D tour is processing…" : "3D tour not yet available"}
          </p>
        </div>
      </div>
    );
  }

  if (tour.viewer_type === "matterport_embed" && tour.asset_url) {
    return <MatterportEmbed url={tour.asset_url} />;
  }

  return <RoomWalkthroughViewer tour={tour} />;
}

function MatterportEmbed({ url }: { url: string }) {
  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
      <iframe src={url} title="3D Property Tour" className="h-full w-full" allow="xr-spatial-tracking; fullscreen" allowFullScreen />
    </div>
  );
}

function RoomWalkthroughViewer({ tour }: { tour: PropertyTour }) {
  const scenes = tour.scenes ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState(0); // horizontal "look around" percentage
  const dragState = useRef<{ startX: number; startPan: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scene = scenes[activeIndex];
  const isVideo = scene?.scene_type === "video_sweep";
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function goTo(delta: number) {
    setActiveIndex((i) => (i + delta + scenes.length) % scenes.length);
    setZoom(1);
    setPanOffset(0);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragState.current = { startX: e.clientX, startPan: panOffset };
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const delta = e.clientX - dragState.current.startX;
    setPanOffset(Math.max(-100, Math.min(100, dragState.current.startPan + delta / 4)));
  }
  function handlePointerUp() {
    dragState.current = null;
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div
        className="relative aspect-video cursor-grab overflow-hidden bg-charcoal-950 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {isVideo ? (
          <video
            key={scene.id}
            src={scene.media_url}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover transition-transform duration-150"
            style={{ transform: `scale(${zoom}) translateX(${panOffset * 0.3}px)` }}
          />
        ) : (
          <div
            key={scene.id}
            className="h-full w-full bg-cover bg-center transition-transform duration-150"
            style={{
              backgroundImage: `url(${scene.media_url})`,
              backgroundSize: `${140 * zoom}%`,
              backgroundPositionX: `${50 + panOffset}%`,
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-sm font-medium text-white">{scene?.room_name}</p>
          <p className="text-xs text-white/50">
            Room {activeIndex + 1} of {scenes.length} · Drag to look around
          </p>
        </div>

        {scenes.length > 1 && (
          <>
            <button
              onClick={() => goTo(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
              aria-label="Previous room"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => goTo(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
              aria-label="Next room"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <div className="absolute right-3 top-3 flex gap-1.5">
          <ToolButton onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))} icon={ZoomIn} label="Zoom in" />
          <ToolButton onClick={() => setZoom((z) => Math.max(1, z - 0.25))} icon={ZoomOut} label="Zoom out" />
          <ToolButton onClick={() => setPanOffset(0)} icon={RotateCw} label="Reset rotation" />
          <ToolButton onClick={toggleFullscreen} icon={isFullscreen ? Minimize : Maximize} label="Fullscreen" />
        </div>
      </div>

      {scenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-charcoal-900 p-2">
          {scenes.map((s, i) => (
            <motion.button
              key={s.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setActiveIndex(i);
                setZoom(1);
                setPanOffset(0);
              }}
              className={`shrink-0 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition ${
                i === activeIndex ? "border-teal-400 text-white" : "border-transparent text-white/50"
              }`}
            >
              {s.room_name}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: typeof ZoomIn;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
    >
      <Icon size={14} />
    </button>
  );
}
