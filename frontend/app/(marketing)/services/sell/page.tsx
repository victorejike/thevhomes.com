import type { Metadata } from "next";
import { UserCheck, ClipboardCheck, MessageCircle, Wallet } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList, InfoGrid, InfoCard } from "@/components/info-page-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Sell a Property",
  description:
    "List your property for sale on TheVHomes through a verified agent — free to publish, reviewed for quality, and connected to serious, verified buyers.",
};

export default function SellPage() {
  return (
    <InfoPageShell
      eyebrow="Services"
      title="Sell a Property"
      subtitle="Reach verified, motivated buyers by listing your property through TheVHomes' network of trusted agents."
    >
      <InfoSection title="List through a verified agent" icon={UserCheck}>
        <p>
          To keep the marketplace trustworthy, every listing on TheVHomes is published by a verified agent carrying
          a unique agent ID (TVH-AGT-######). If you already work with an agent, ask them to list your property on
          your behalf. If you don&apos;t, you can register as an agent yourself and go through our identity
          verification to list your own properties.
        </p>
      </InfoSection>

      <InfoSection title="Every listing is reviewed before it goes live" icon={ClipboardCheck}>
        <p>
          Once a listing is submitted, our admin team reviews it before it&apos;s published to buyers — checking
          photos, the description, the location details, and, where provided, the interactive 3D tour. This keeps
          quality consistent across the platform and protects buyers from misleading listings.
        </p>
        <InfoList
          items={[
            "Photos and descriptions are checked for accuracy and completeness.",
            "Location and pricing details are verified before publishing.",
            "3D tours (where added) are reviewed to make sure they represent the actual property.",
            "Listings that don't meet our standards are sent back for revision, not silently rejected.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Connect with buyers directly" icon={MessageCircle}>
        <p>
          Once live, your listing is discoverable through search, filters, and our AI search assistant. Interested
          buyers reach out through verified in-app chat and can book physical or live-video viewings, with fees
          collected securely through Paystack or Flutterwave — no back-and-forth over unofficial channels.
        </p>
      </InfoSection>

      <InfoSection title="No listing fees" icon={Wallet}>
        <p>
          Publishing a property for sale on TheVHomes costs nothing upfront. Our goal is to make it easy for
          property owners and agents to reach genuine buyers, with the platform&apos;s trust and verification systems
          doing the heavy lifting.
        </p>
        <InfoGrid columns={3}>
          <InfoCard title="Free to publish">No listing fee to get your property in front of buyers.</InfoCard>
          <InfoCard title="Quality-checked">Admin review keeps every published listing credible and complete.</InfoCard>
          <InfoCard title="Verified reach">Your listing is seen by identity-verified, serious buyers.</InfoCard>
        </InfoGrid>
      </InfoSection>

      <div className="text-center">
        <MotionLink
          href="/register?role=agent"
          {...tapScale}
          className="inline-block rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Become a Verified Agent
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
