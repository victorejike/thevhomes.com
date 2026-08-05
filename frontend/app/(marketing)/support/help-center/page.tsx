import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  Home,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { InfoPageShell, InfoCard, InfoGrid } from "@/components/info-page-shell";
import { MotionLink } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Find answers and guidance on using TheVHomes — verification, bookings, payments, becoming an agent, and more.",
};

const topics = [
  {
    icon: Home,
    title: "Getting Started",
    description:
      "Learn how to search for properties, filter by location and budget, and explore 3D tours before booking a viewing.",
    href: "/support/faq",
    cta: "Read the FAQ",
  },
  {
    icon: ShieldCheck,
    title: "Identity Verification",
    description:
      "Every buyer, tenant, and agent verifies their identity with a valid NIN through our VerifyMe integration before transacting.",
    href: "/dashboard/verify",
    cta: "Verify your identity",
  },
  {
    icon: CalendarCheck,
    title: "Booking a Viewing",
    description:
      "Schedule a physical or live-video viewing directly with a verified agent, and track the status from your dashboard.",
    href: "/dashboard/bookings",
    cta: "View your bookings",
  },
  {
    icon: CreditCard,
    title: "Payments & Refunds",
    description:
      "Understand how viewing fees and payments are processed securely via Paystack and Flutterwave, and when refunds apply.",
    href: "/legal/refund-policy",
    cta: "Read the refund policy",
  },
  {
    icon: UserPlus,
    title: "Becoming an Agent",
    description:
      "Complete personal identity verification, then submit a business application to be issued your official TVH-AGT number.",
    href: "/register?role=agent",
    cta: "Apply as an agent",
  },
  {
    icon: BadgeCheck,
    title: "Property Listings",
    description:
      "See how listings are reviewed and verified before going live, and what's expected of agents who publish them.",
    href: "/legal/property-listing-policy",
    cta: "Read the listing policy",
  },
];

export default function HelpCenterPage() {
  return (
    <InfoPageShell
      eyebrow="Support"
      title="Help Center"
      subtitle="Everything you need to know about searching, verifying, booking, and transacting safely on TheVHomes."
    >
      <InfoGrid columns={3}>
        {topics.map((topic) => (
          <InfoCard key={topic.title}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <topic.icon size={16} className="text-teal-400" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-white">{topic.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{topic.description}</p>
            <MotionLink
              href={topic.href}
              whileHover={{ x: 4 }}
              className="mt-4 inline-block text-sm font-medium text-teal-300 hover:text-teal-200"
            >
              {topic.cta} &rarr;
            </MotionLink>
          </InfoCard>
        ))}
      </InfoGrid>
    </InfoPageShell>
  );
}
