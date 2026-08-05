import type { Metadata } from "next";
import { Hotel, BadgeCheck, CalendarCheck, Sparkles } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList, InfoGrid, InfoCard } from "@/components/info-page-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Hotels",
  description:
    "Book verified hotel-style stays and serviced apartments on TheVHomes — the trust and transparency of a real estate platform, with hotel-grade comfort.",
};

export default function HotelsPage() {
  return (
    <InfoPageShell
      eyebrow="Services"
      title="Hotels"
      subtitle="Serviced apartments and partner hotels offering hotel-style amenities, booked with the same verification and trust as every TheVHomes listing."
    >
      <InfoSection title="Hotel-grade comfort, verified listings" icon={Hotel}>
        <p>
          Alongside residential and shortlet listings, TheVHomes features serviced apartments and hotel partner
          properties for guests who want hotel-style amenities — housekeeping, security, front-desk support — with
          the added transparency of a verified real estate platform.
        </p>
      </InfoSection>

      <InfoSection title="Verified to a real standard" icon={BadgeCheck}>
        <p>
          Every hotel-type listing carries the same verification badges you see across the platform, so you know
          exactly what you&apos;re booking before you arrive:
        </p>
        <InfoList
          items={[
            "🏠 Verified Property — amenities, photos, and location have been confirmed by our team.",
            "🏅 Verified Agent — the listing is managed by a verified TVH-AGT-###### agent or partner.",
            "✅ Identity Verified — the host or property manager's identity has been checked.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Simple, secure booking" icon={CalendarCheck}>
        <p>
          Check room availability, book your stay, and pay securely via Paystack or Flutterwave — all without
          leaving the app. Need to ask about check-in times or amenities first? Chat directly with the property
          manager before you confirm.
        </p>
        <InfoGrid columns={3}>
          <InfoCard title="Trusted amenities">Verified details on rooms, facilities, and services offered.</InfoCard>
          <InfoCard title="Secure payment">Book and pay safely through the platform&apos;s payment partners.</InfoCard>
          <InfoCard title="Direct support">Chat with the property manager for any pre-arrival questions.</InfoCard>
        </InfoGrid>
      </InfoSection>

      <InfoSection title="Great for guests and business travellers" icon={Sparkles}>
        <p>
          Whether you need a comfortable stay for a short business trip or a hotel-style base while you explore
          longer-term housing options, our hotel listings combine the reliability of a hotel with the trust
          infrastructure of TheVHomes.
        </p>
      </InfoSection>

      <div className="text-center">
        <MotionLink
          href="/properties?property_type=hotel"
          {...tapScale}
          className="inline-block rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
        >
          Browse Hotel Stays
        </MotionLink>
      </div>
    </InfoPageShell>
  );
}
