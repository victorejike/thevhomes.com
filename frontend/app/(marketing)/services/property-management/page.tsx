import type { Metadata } from "next";
import { Users, Wrench, ClipboardList, FileBarChart } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList, InfoGrid, InfoCard } from "@/components/info-page-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Property Management",
  description:
    "Let TheVHomes' verified agent network manage tenants, rent collection, maintenance, and inspections for your property, hands-off and fully reported.",
};

export default function PropertyManagementPage() {
  return (
    <InfoPageShell
      eyebrow="Services"
      title="Property Management"
      subtitle="A premium add-on for owners who want their property professionally managed by a verified TheVHomes agent, from tenants to maintenance."
    >
      <InfoSection title="Hands-off ownership" icon={Users}>
        <p>
          If you own property but don&apos;t have the time — or want — to manage tenants and day-to-day operations
          yourself, your property&apos;s assigned verified agent can coordinate property management on your behalf as
          a premium add-on service.
        </p>
      </InfoSection>

      <InfoSection title="What's covered" icon={ClipboardList}>
        <InfoList
          items={[
            "Tenant sourcing and screening through the same verification standards used across the platform.",
            "Rent collection and disbursement, so you don't have to chase payments.",
            "Maintenance coordination for repairs and upkeep requests from tenants.",
            "Periodic property inspections to catch issues early and keep the property in good condition.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Maintenance, handled" icon={Wrench}>
        <p>
          When something needs fixing, your agent coordinates with vetted contractors and keeps you informed, so
          small issues don&apos;t turn into costly repairs — and you don&apos;t have to field the calls yourself.
        </p>
      </InfoSection>

      <InfoSection title="Clear, periodic reporting" icon={FileBarChart}>
        <p>
          You&apos;ll receive regular updates and inspection reports from your assigned agent, giving you visibility
          into your property&apos;s condition and performance even while you&apos;re hands-off.
        </p>
        <InfoGrid columns={3}>
          <InfoCard title="Verified agent-managed">Coordinated through your property&apos;s assigned verified agent.</InfoCard>
          <InfoCard title="Consistent reporting">Regular inspection and rent reports so you stay informed.</InfoCard>
          <InfoCard title="Less hassle for you">Tenant issues and maintenance handled on your behalf.</InfoCard>
        </InfoGrid>
      </InfoSection>

      <div className="text-center">
        <MotionLink
          href="/contact"
          {...tapScale}
          className="inline-block rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Talk to Us About Property Management
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
