import type { Metadata } from "next";
import { BedDouble, Zap, ShieldCheck, CalendarClock } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList, InfoGrid, InfoCard } from "@/components/info-page-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Shortlet Apartments",
  description:
    "Book verified, furnished shortlet apartments by the night in Abuja, Lagos, and beyond — instant booking, secure payment, flexible stays.",
};

export default function ShortletPage() {
  return (
    <InfoPageShell
      eyebrow="Services"
      title="Shortlet Apartments"
      subtitle="Fully furnished apartments booked by the night, for business trips, relocation, or vacation — verified for comfort and trust."
    >
      <InfoSection title="Furnished stays, without the hassle" icon={BedDouble}>
        <p>
          Shortlet listings on TheVHomes are fully furnished apartments available at a nightly rate — ideal if
          you&apos;re travelling for business, relocating to a new city while you house-hunt, or simply want a
          comfortable place to stay on vacation in Abuja, Lagos, or beyond.
        </p>
      </InfoSection>

      <InfoSection title="Instant, secure booking" icon={Zap}>
        <p>
          Check availability, pick your dates, and pay securely through Paystack or Flutterwave — all inside the
          app. No lengthy back-and-forth negotiations required for a short stay.
        </p>
        <InfoList
          items={[
            "Real-time availability so you know exactly what dates are open.",
            "Secure in-app payment for your booking, no cash handovers.",
            "Direct chat with your host for check-in details and special requests.",
            "Flexible stay lengths, from a couple of nights to several weeks.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Verified hosts, verified properties" icon={ShieldCheck}>
        <p>
          Every shortlet host on TheVHomes goes through the same identity and property verification as our other
          agents, so you can book with confidence that the apartment in the photos is the apartment you&apos;ll
          arrive at.
        </p>
        <InfoGrid columns={3}>
          <InfoCard title="Verified hosts">Hosts are identity-verified before they can list a shortlet.</InfoCard>
          <InfoCard title="Flexible dates">Book for a weekend, a work trip, or an extended relocation stay.</InfoCard>
          <InfoCard title="Real reviews, real photos">Listings are reviewed for accuracy before going live.</InfoCard>
        </InfoGrid>
      </InfoSection>

      <InfoSection title="Perfect for every kind of stay" icon={CalendarClock}>
        <p>
          Whether it&apos;s a client visit, a wedding weekend, or a few months while you find a permanent home,
          shortlet apartments give you the comfort of a fully-equipped home without the commitment of a long-term
          lease.
        </p>
      </InfoSection>

      <div className="text-center">
        <MotionLink
          href="/properties?purpose=shortlet"
          {...tapScale}
          className="inline-block rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Browse Shortlet Apartments
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
