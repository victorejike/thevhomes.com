import type { LucideIcon } from "lucide-react";

/**
 * Shared shell for every static "informational" page added in Phase 4
 * (legal pages, company pages, services pages, support pages, etc.) so they
 * all inherit the exact same premium look — dark charcoal canvas, teal
 * accents, Playfair Display headings — without duplicating markup. Pages
 * only need to describe their content; this component owns all layout.
 *
 * Deliberately a plain Server Component (no "use client"/framer-motion): it
 * accepts `icon` as a component reference (e.g. `icon={Sparkles}`), and
 * component references can't cross the Server->Client Component
 * serialization boundary. Keeping this a Server Component means every page
 * that renders it — itself a Server Component — can pass icons directly
 * without needing to pre-render them into elements.
 */
export function InfoPageShell({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-28 lg:px-8">
      <div className="text-center">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-white/60">{subtitle}</p>}
        {lastUpdated && <p className="mt-3 text-xs text-white/40">Last updated: {lastUpdated}</p>}
      </div>

      <div className="mx-auto mt-14 max-w-none space-y-10">{children}</div>
    </div>
  );
}

/** A titled block of prose/content within an info page. */
export function InfoSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-white sm:text-2xl">
        {Icon && <Icon size={20} className="text-teal-400" />}
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

/** A bordered card used to group related content within a section. */
export function InfoCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-teal-400/30 ${className}`}
    >
      {title && <h3 className="font-display text-base font-semibold text-white">{title}</h3>}
      <div className={title ? "mt-2" : ""}>{children}</div>
    </div>
  );
}

/** Simple bullet list styled consistently with the rest of the platform. */
export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-white/70">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A responsive grid of info cards, for things like "Our Values" or "Services". */
export function InfoGrid({ children, columns = 3 }: { children: React.ReactNode; columns?: 2 | 3 | 4 }) {
  const colClass =
    columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid grid-cols-1 gap-5 ${colClass}`}>{children}</div>;
}
