import { MotionLink, tapScale } from "@/components/motion-link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-charcoal-950 px-6 text-center">
      <span className="font-display text-6xl font-semibold text-teal-400">404</span>
      <h1 className="font-display text-2xl font-semibold text-white">Page Not Found</h1>
      <p className="max-w-sm text-white/60">
        The page or property you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <MotionLink
        href="/"
        {...tapScale}
        className="rounded-full bg-teal-gradient px-6 py-3 text-sm font-semibold text-charcoal-950"
      >
        Back to Home
      </MotionLink>
    </div>
  );
}
