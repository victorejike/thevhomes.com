import type { Metadata } from "next";
import { Search, Video, CalendarCheck, ShieldCheck } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList, InfoGrid, InfoCard } from "@/components/info-page-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Buy a Property",
  description:
    "Find and buy verified homes, land, and apartments in Abuja and beyond with TheVHomes — 3D tours, in-app bookings, and identity-verified agents.",
};

export default function BuyPage() {
  return (
    <InfoPageShell
      eyebrow="Services"
      title="Buy a Property"
      subtitle="From your first search to signing the deal, TheVHomes gives you a safer, faster way to buy real estate in Nigeria."
    >
      <InfoSection title="Search smarter, not harder" icon={Search}>
        <p>
          Every property on TheVHomes is filtered by location, budget, bedrooms, and property type, and you can
          narrow things down further with our AI-powered search assistant — just describe what you&apos;re looking
          for in plain language, and it will surface matching listings for you.
        </p>
        <p>
          Listings you see are backed by verification badges, so you always know what you&apos;re dealing with:
        </p>
        <InfoList
          items={[
            "✅ Identity Verified — the seller or landlord has confirmed their identity with a valid NIN.",
            "🏅 Verified Agent — the listing is managed by a TVH-AGT-###### agent approved by our admin team.",
            "🏠 Verified Property — the listing's photos, description, and location have been reviewed and confirmed.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Tour before you travel" icon={Video}>
        <p>
          Many listings include an interactive 3D property tour, so you can walk through a home room by room from
          your phone or laptop before deciding whether it&apos;s worth an in-person visit. It&apos;s a huge time-saver
          if you&apos;re relocating from another city or comparing several homes at once.
        </p>
      </InfoSection>

      <InfoSection title="Book a viewing, chat with the agent" icon={CalendarCheck}>
        <p>
          When you&apos;re ready to see a property in person, use our in-app booking system to schedule a physical or
          live-video viewing directly with the listing agent. Viewing fees, where applicable, are paid securely
          through Paystack or Flutterwave — no cash-in-hand arrangements required.
        </p>
        <p>
          Have questions about the property, negotiation, or paperwork? Real-time chat keeps you and the agent in
          direct contact throughout the process, right inside the platform.
        </p>
      </InfoSection>

      <InfoSection title="Buy with confidence" icon={ShieldCheck}>
        <p>
          Because every agent and property owner on TheVHomes goes through NIN-based identity verification, you can
          be confident you&apos;re negotiating with a real person, not a scammer hiding behind a listing photo.
        </p>
        <InfoGrid columns={3}>
          <InfoCard title="Verified listings only">
            No anonymous or unverifiable postings — every property has a traceable, verified agent behind it.
          </InfoCard>
          <InfoCard title="Secure payments">
            Viewing fees and transaction-related payments run through trusted processors, not informal transfers.
          </InfoCard>
          <InfoCard title="Direct communication">
            Chat and book viewings without leaving the platform or sharing personal contact details upfront.
          </InfoCard>
        </InfoGrid>
      </InfoSection>

      <div className="text-center">
        <MotionLink
          href="/properties?purpose=buy"
          {...tapScale}
          className="inline-block rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Browse Properties for Sale
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
