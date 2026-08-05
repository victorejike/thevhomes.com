import type { Metadata } from "next";
import { CheckCircle2, MapPin, Quote, Sparkles, Target, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { InfoPageShell, InfoSection, InfoCard, InfoGrid, InfoList } from "@/components/info-page-shell";
import { CountUp } from "@/components/count-up";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about THE VHOMES LIMITED — our mission, vision, values, and the team building Africa's most trusted verified real estate marketplace.",
};

const STATS = [
  { end: 1200, suffix: "+", label: "Verified Properties" },
  { end: 350, suffix: "+", label: "Trusted Agents" },
  { end: 8500, suffix: "+", label: "Happy Clients" },
  { prefix: "\u20a6", end: 45, suffix: "B+", label: "Transactions Facilitated" },
];

export default async function AboutPage() {
  const content = await api.siteContent.getAbout();

  return (
    <InfoPageShell
      eyebrow="Company"
      title="About TheVHomes Limited"
      subtitle="Building Africa's most trusted verified real estate marketplace — one inspected property and one verified agent at a time."
    >
      <InfoSection title="Company Overview" icon={Sparkles}>
        <p>{content.overview}</p>
      </InfoSection>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InfoCard title="Our Mission">
          <div className="mb-2 flex items-center gap-2 text-teal-400">
            <Target size={16} />
          </div>
          <p className="text-sm text-white/70">{content.mission}</p>
        </InfoCard>
        <InfoCard title="Our Vision">
          <div className="mb-2 flex items-center gap-2 text-teal-400">
            <Eye size={16} />
          </div>
          <p className="text-sm text-white/70">{content.vision}</p>
        </InfoCard>
      </div>

      <InfoSection title="Core Values">
        <InfoGrid columns={2}>
          {content.core_values.map((value) => (
            <InfoCard key={value.title} title={value.title}>
              <p className="text-sm text-white/70">{value.description}</p>
            </InfoCard>
          ))}
        </InfoGrid>
      </InfoSection>

      <InfoSection title="Why Choose TheVHomes" icon={CheckCircle2}>
        <InfoList items={content.why_choose_us} />
      </InfoSection>

      <InfoSection title="Areas We Operate" icon={MapPin}>
        <div className="flex flex-wrap gap-2.5">
          {content.areas_we_operate.map((area) => (
            <span
              key={area}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70"
            >
              {area}
            </span>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="Services Offered">
        <InfoGrid columns={3}>
          {content.services_offered.map((service) => (
            <InfoCard key={service}>
              <p className="text-sm text-white/80">{service}</p>
            </InfoCard>
          ))}
        </InfoGrid>
      </InfoSection>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 sm:px-10">
        <h2 className="text-center font-display text-xl font-semibold text-white sm:text-2xl">
          TheVHomes by the Numbers
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl font-semibold text-teal-300 sm:text-3xl">
                <CountUp end={stat.end} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-xs text-white/60 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <InfoSection title="What Our Clients Say">
        <InfoGrid columns={3}>
          {content.testimonials.map((t) => (
            <InfoCard key={t.name}>
              <Quote size={18} className="text-teal-400" />
              <p className="mt-3 text-sm italic text-white/70">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-white/50">{t.role}</p>
            </InfoCard>
          ))}
        </InfoGrid>
      </InfoSection>

      {/* Founder section */}
      <section className="rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-400/[0.06] to-transparent p-6 sm:p-10">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">Leadership</span>
        <div className="mt-6 flex flex-col items-start gap-8 sm:flex-row">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-teal-gradient font-display text-3xl font-semibold text-charcoal-950">
            TV
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
                {content.founder.name}
              </h2>
              <p className="text-sm text-teal-300">{content.founder.title}</p>
            </div>
            <p className="text-sm leading-relaxed text-white/70">{content.founder.bio}</p>
            <blockquote className="border-l-2 border-teal-400/50 pl-4 text-sm italic leading-relaxed text-white/80">
              {content.founder.message}
            </blockquote>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Vision for TheVHomes
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{content.founder.vision}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center gap-4 pt-4 text-center">
        <p className="text-white/60">Ready to find a home you can actually trust?</p>
        <MotionLink
          href="/properties"
          {...tapScale}
          className="rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Explore Verified Properties
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
