import type { Metadata } from "next";
import { Rocket, ShieldCheck, Scan, Globe2 } from "lucide-react";
import { InfoPageShell, InfoSection, InfoCard, InfoGrid } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "How TheVHomes was built to bring trust, transparency, and technology to the Nigerian real estate market.",
};

export default function OurStoryPage() {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="Our Story"
      subtitle="Built to solve a problem every home seeker in Nigeria knows too well."
    >
      <InfoSection title="The Problem We Set Out to Solve">
        <p>
          Finding a home or investment property in Nigeria has long meant navigating a market full of
          uncertainty — listings that don&apos;t match reality, agents who disappear after collecting an
          inspection fee, and buyers forced to travel across cities just to confirm whether a property
          even exists. For a market as large and fast-growing as Abuja&apos;s, there was no reliable way to
          separate genuine opportunities from costly mistakes.
        </p>
        <p>
          TheVHomes was founded on a simple conviction: real estate in Nigeria deserves the same level of
          trust, verification, and transparency that buyers and investors expect anywhere else in the
          world. We set out to build a platform where every listing, every agent, and every transaction
          could be trusted from the very first click.
        </p>
      </InfoSection>

      <InfoSection title="Our Founding Vision" icon={Rocket}>
        <p>
          From day one, the vision behind TheVHomes has been to become Nigeria&apos;s most trusted property
          marketplace — a platform where verification isn&apos;t an afterthought, but the foundation on which
          everything else is built. That meant designing our systems around three pillars: verified
          identities, verified listings, and verified agents, so that every user on the platform could
          engage with confidence.
        </p>
      </InfoSection>

      <InfoSection title="Key Milestones" icon={ShieldCheck}>
        <InfoGrid columns={2}>
          <InfoCard title="Platform Launch">
            TheVHomes launched in Abuja with a curated selection of verified residential and commercial
            listings, giving buyers and renters a safer starting point for their property search.
          </InfoCard>
          <InfoCard title="Identity Verification">
            We introduced NIN and VerifyMe-powered identity checks for agents and property owners,
            making it significantly harder for bad actors to operate on the platform.
          </InfoCard>
          <InfoCard title="Interactive 3D Tours">
            To eliminate wasted site visits, we rolled out interactive 3D property tours, allowing buyers
            and diaspora investors to inspect a home in detail from anywhere in the world before ever
            stepping foot on the property.
          </InfoCard>
          <InfoCard title="Growing Our Agent Network">
            We built a nationwide network of vetted, verified agents, giving property owners access to
            professionals who meet TheVHomes&apos; standards for conduct and transparency.
          </InfoCard>
        </InfoGrid>
      </InfoSection>

      <InfoSection title="Where We're Headed" icon={Globe2}>
        <p>
          Our work is far from finished. We&apos;re expanding TheVHomes to more cities across Nigeria, deepening
          our verification technology so trust becomes an inherent part of every transaction, and laying the
          groundwork to bring this same model of transparency to other African real estate markets in the
          years ahead.
        </p>
        <p>
          As the market evolves, we remain committed to a single idea that hasn&apos;t changed since our
          founding: property decisions — some of the biggest financial decisions people ever make — should
          never have to be made on trust alone.
        </p>
      </InfoSection>

      <InfoSection title="Verification at Our Core" icon={Scan}>
        <p>
          Every feature we build is measured against one question: does this make the platform more
          trustworthy? That philosophy continues to guide our roadmap as we invest in smarter fraud
          detection, deeper agent accountability, and richer tools for remote property inspection.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
