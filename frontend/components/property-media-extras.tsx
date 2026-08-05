"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Maximize2, PlayCircle, View, X } from "lucide-react";
import type { Property } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import { AuthGateModal } from "./auth-gate-modal";

// The 3D viewer pulls in drag/zoom/fullscreen logic that most visitors never
// touch — code-split it out of the main property-page bundle and only fetch
// it once someone actually opens the tour.
const TourViewer = dynamic(() => import("./tour-viewer").then((m) => m.TourViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white/40">
      Loading 3D viewer…
    </div>
  ),
});

/**
 * Renders, in order, below the property image gallery:
 *  1. A video gallery (property.video_urls) — lazy-loaded, muted-by-default
 *     native <video> tags that only fetch media once played.
 *  2. The Interactive 3D Tour section — a preview thumbnail + button that is
 *     gated behind authentication. Signed-out visitors see a sign-in/sign-up
 *     modal ("Please sign in to access the interactive 3D property tour.");
 *     on success they're returned to this exact page with the viewer opened
 *     automatically (no redirect round-trip needed).
 */
export function PropertyMediaExtras({ property }: { property: Property }) {
  const { user } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const videos = property.video_urls ?? [];
  const tour = property.tour;
  const youtubeID = property.youtube_video_id;

  function handleOpenTour() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setTourOpen(true);
  }

  function handleAuthenticated() {
    setAuthOpen(false);
    setTourOpen(true);
  }

  return (
    <>
      {youtubeID && (
        <section className="mt-10" aria-labelledby="property-video-tour-heading">
          <h2 id="property-video-tour-heading" className="font-display text-xl font-semibold text-white">
            Video Tour
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
            <YouTubeEmbed videoID={youtubeID} title={`${property.title} — video tour`} />
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="mt-10" aria-labelledby="property-videos-heading">
          <h2 id="property-videos-heading" className="font-display text-xl font-semibold text-white">
            Videos
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((url, i) => (
              <div
                key={url + i}
                className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black"
              >
                <video
                  src={url}
                  controls
                  preload="none"
                  playsInline
                  poster={property.images?.[0]?.url}
                  className="h-full w-full object-cover"
                  aria-label={`${property.title} video ${i + 1}`}
                >
                  <track kind="captions" />
                </video>
                <PlayCircle
                  size={18}
                  className="pointer-events-none absolute left-3 top-3 text-white/70 drop-shadow group-hover:hidden"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {tour && (
        <section className="mt-10" aria-labelledby="property-3d-tour-heading">
          <h2 id="property-3d-tour-heading" className="font-display text-xl font-semibold text-white">
            Interactive 3D Tour
          </h2>
          <div className="mt-4 flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-black sm:w-64">
              {tour.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tour.thumbnail_url}
                  alt="3D tour preview"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-charcoal-900 text-white/30">
                  <View size={28} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <View size={32} className="text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/70">
                Walk through every room with drag-to-look navigation, zoom, and fullscreen — right in
                your browser, no app required.
              </p>
              <motion.button
                onClick={handleOpenTour}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-gradient px-5 py-2.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
              >
                <Maximize2 size={15} /> View Interactive 3D Tour
              </motion.button>
              {!user && (
                <p className="mt-2 text-xs text-white/40">Sign in required to launch the viewer.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {authOpen && (
        <AuthGateModal
          message="Please sign in to access the interactive 3D property tour."
          onClose={() => setAuthOpen(false)}
          onAuthenticated={handleAuthenticated}
        />
      )}

      {tourOpen && tour && (
        <TourFullscreenModal onClose={() => setTourOpen(false)}>
          <TourViewer tour={tour} />
        </TourFullscreenModal>
      )}
    </>
  );
}

/**
 * Privacy-enhanced YouTube player.
 *
 * The iframe is only mounted once the visitor clicks play, so the page ships a
 * single thumbnail instead of ~1MB of YouTube player JS on load — this is what
 * keeps the property page's Lighthouse score above 90. Until then we render a
 * static facade, which also means autoplay is off by default: nothing plays
 * unless the visitor asks for it.
 *
 * youtube-nocookie.com is used so YouTube sets no tracking cookies for people
 * who never interact with the player, and the visitor is never redirected off
 * TheVHomes to watch the tour.
 */
function YouTubeEmbed({ videoID, title }: { videoID: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  const params = new URLSearchParams({
    autoplay: playing ? "1" : "0",
    rel: "0", // only show related videos from the same channel
    modestbranding: "1",
    playsinline: "1",
  });

  return (
    <div className="relative aspect-video w-full">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoID}?${params.toString()}`}
          title={title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${title}`}
          className="group absolute inset-0 h-full w-full overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoID}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/20">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-gradient text-charcoal-950 shadow-glow transition group-hover:brightness-110">
              <PlayCircle size={32} />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

function TourFullscreenModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive 3D property tour"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-3 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl"
      >
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.85 }}
          aria-label="Close 3D tour"
          className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white hover:border-teal-400/50 sm:-top-12"
        >
          <X size={18} />
        </motion.button>
        {children}
      </motion.div>
    </div>
  );
}
