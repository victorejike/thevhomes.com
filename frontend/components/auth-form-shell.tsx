import { MotionLink } from "./motion-link";

export function AuthFormShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-6 py-28">
      <div className="w-full max-w-md">
        <MotionLink
          href="/"
          whileHover={{ scale: 1.05 }}
          className="mb-8 block text-center font-display text-2xl font-semibold text-white"
        >
          THE<span className="text-teal-400">V</span>HOMES
        </MotionLink>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-white/50">{footer}</p>
      </div>
    </div>
  );
}
