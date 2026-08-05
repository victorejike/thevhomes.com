import type { Metadata } from "next";
import { Quote, Target } from "lucide-react";
import { InfoPageShell, InfoSection, InfoCard } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Meet the Founder",
  description:
    "The story and vision behind THE VHOMES LIMITED, founded to bring trust and verification to Nigerian real estate.",
};

export default function FounderPage() {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="Meet the Founder"
      subtitle="The vision behind THE VHOMES LIMITED, and the mission that continues to drive it forward."
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-teal-gradient text-4xl font-display text-charcoal-950">
          TV
        </div>
        <h2 className="mt-5 font-display text-xl font-semibold text-white">Founder &amp; CEO</h2>
        <p className="text-white/60">THE VHOMES LIMITED</p>
      </div>

      <InfoSection title="Background">
        <p>
          TheVHomes was founded by a team with a background spanning real estate, technology, and financial
          services in Nigeria — a combination that made the gaps in the property market impossible to
          ignore. Time and again, the same pattern emerged: capable buyers and investors held back by a
          lack of trustworthy information, and honest agents unable to distinguish themselves from bad
          actors flooding the market with fake or misleading listings.
        </p>
        <p>
          That firsthand experience, working across property transactions and digital platforms, shaped the
          conviction that technology could close this trust gap — not by replacing the human relationships
          at the heart of real estate, but by giving everyone involved better tools to verify who and what
          they were dealing with.
        </p>
      </InfoSection>

      <InfoSection title="Leadership Message" icon={Quote}>
        <InfoCard>
          <p className="italic text-white/70">
            &ldquo;We started TheVHomes because we believe finding a home or making a property investment
            should be exciting, not stressful. Trust shouldn&apos;t be a gamble — it should be built into the
            platform itself. Every decision we make, from how we verify an agent to how we design a property
            listing, comes back to one question: would we trust this if it were our own money, our own
            family, our own home? That standard is what we hold ourselves to every day, and it&apos;s what
            we&apos;ll keep building on as TheVHomes grows.&rdquo;
          </p>
          <p className="mt-4 text-sm text-white/50">— Founder &amp; CEO, THE VHOMES LIMITED</p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="Vision for TheVHomes" icon={Target}>
        <p>
          Over the next five years, our goal is for TheVHomes to become the most trusted verified property
          marketplace in Africa — the first place anyone thinks to go, whether they&apos;re a first-time renter
          in Abuja, a diaspora investor buying a home sight unseen, or an agent looking to build a
          reputable, verified business.
        </p>
        <p>
          That means continuing to invest in verification technology, expanding our footprint across
          Nigerian cities and beyond, and never losing sight of the people on the other side of every
          transaction — the families, investors, and agents who trust us to get it right.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
