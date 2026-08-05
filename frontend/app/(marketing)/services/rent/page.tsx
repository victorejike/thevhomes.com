import type { Metadata } from "next";
import { Search, CalendarCheck, HandCoins, Truck } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList, InfoGrid, InfoCard } from "@/components/info-page-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Rent a Property",
  description:
    "Find verified rental homes and apartments in Abuja and beyond, book viewings, and move in with agent-assisted support through TheVHomes.",
};

export default function RentPage() {
  return (
    <InfoPageShell
      eyebrow="Services"
      title="Rent a Property"
      subtitle="Browse verified rentals by city, budget, and bedroom count — and get agent support all the way through move-in."
    >
      <InfoSection title="Find rentals that fit your budget" icon={Search}>
        <p>
          Filter rental listings by city, budget, number of bedrooms, and property type, or describe what
          you&apos;re looking for to our AI search assistant. Every listing carries verification badges so you know
          the property, and the agent behind it, have been checked.
        </p>
      </InfoSection>

      <InfoSection title="Schedule a viewing before you commit" icon={CalendarCheck}>
        <p>
          Book a physical or live-video viewing directly through the app, and chat in real time with the listing
          agent to ask about the property, amenities, or the surrounding neighbourhood before you decide.
        </p>
      </InfoSection>

      <InfoSection title="Understand Nigerian rental terms" icon={HandCoins}>
        <p>
          Renting in Nigeria typically works differently from month-to-month leases elsewhere — most landlords
          expect rent to be paid annually (sometimes for two years upfront), along with agency and legal fees. Your
          agent will walk you through the exact terms for each property, including:
        </p>
        <InfoList
          items={[
            "Annual rent payment expectations and what's included.",
            "Applicable agency and legal fees, and who they're paid to.",
            "Lease duration, renewal terms, and any caution deposit.",
            "Agent-assisted negotiation to help you get fair terms.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Support beyond signing the lease" icon={Truck}>
        <p>
          Your agent doesn&apos;t disappear once the lease is signed — they&apos;re there to help coordinate
          handover, answer questions about the property, and connect you with the right people if issues come up
          during your tenancy.
        </p>
        <InfoGrid columns={3}>
          <InfoCard title="Verified rentals">Every listing is checked by our admin team before it goes live.</InfoCard>
          <InfoCard title="Direct agent chat">Ask questions and negotiate terms without leaving the app.</InfoCard>
          <InfoCard title="Secure bookings">Viewing fees are paid safely via Paystack or Flutterwave.</InfoCard>
        </InfoGrid>
      </InfoSection>

      <div className="text-center">
        <MotionLink
          href="/properties?purpose=rent"
          {...tapScale}
          className="inline-block rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Browse Rental Properties
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
