import type { Metadata } from "next";
import { Building2, FileSearch, Handshake, Warehouse } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList, InfoGrid, InfoCard } from "@/components/info-page-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Commercial Properties",
  description:
    "Find office space, retail units, warehouses, and event centers for your business or investment through TheVHomes' verified commercial listings.",
};

export default function CommercialPage() {
  return (
    <InfoPageShell
      eyebrow="Services"
      title="Commercial Properties"
      subtitle="Office space, retail units, warehouses, and event centers for businesses and investors, backed by verified listings and agent support."
    >
      <InfoSection title="Space built for business" icon={Building2}>
        <p>
          Beyond homes and apartments, TheVHomes lists commercial properties for businesses and investors, including
          office suites, retail storefronts, warehouses, and event centers across Abuja and other key markets.
        </p>
        <InfoList
          items={[
            "Office space for growing teams, from single suites to full floors.",
            "Retail units in high-traffic locations for storefronts and showrooms.",
            "Warehouses and industrial space for storage, logistics, and light manufacturing.",
            "Event centers and halls for functions, conferences, and large gatherings.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Due diligence support" icon={FileSearch}>
        <p>
          Commercial decisions carry higher stakes, so verified agents on TheVHomes help you dig into the details
          that matter — zoning, title documentation, access, and property condition — before you commit.
        </p>
      </InfoSection>

      <InfoSection title="Agent-assisted negotiation" icon={Handshake}>
        <p>
          Commercial leases are often longer-term and more complex than residential ones. Your agent works with you
          through the negotiation process, from lease terms and service charges to renewal clauses, so you go into
          the agreement fully informed.
        </p>
      </InfoSection>

      <InfoSection title="Built for scale" icon={Warehouse}>
        <InfoGrid columns={3}>
          <InfoCard title="Verified listings">Commercial properties are reviewed before publishing, just like residential ones.</InfoCard>
          <InfoCard title="Direct agent access">Chat and book viewings with verified commercial agents in-app.</InfoCard>
          <InfoCard title="Investor-ready">Suited for businesses scaling up and investors expanding a portfolio.</InfoCard>
        </InfoGrid>
      </InfoSection>

      <div className="text-center">
        <MotionLink
          href="/properties?property_type=office"
          {...tapScale}
          className="inline-block rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Browse Commercial Properties
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
