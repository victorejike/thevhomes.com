import type { Metadata } from "next";
import { InfoPageShell, InfoSection, InfoCard, InfoGrid } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "The people behind THE VHOMES LIMITED, working to make real estate in Nigeria safer, simpler, and more transparent.",
};

const team = [
  {
    initials: "PV",
    role: "Head of Property Verification",
    description:
      "Leads the team responsible for confirming that every listing on TheVHomes matches reality — from ownership documents to on-site inspections.",
  },
  {
    initials: "SE",
    role: "Lead Software Engineer",
    description:
      "Oversees the engineering team building and maintaining the TheVHomes platform, including our identity verification and 3D property tour systems.",
  },
  {
    initials: "CS",
    role: "Customer Success Manager",
    description:
      "Supports buyers, renters, and investors throughout their journey on TheVHomes, making sure every question and concern is resolved quickly.",
  },
  {
    initials: "AR",
    role: "Head of Agent Relations",
    description:
      "Manages the onboarding, vetting, and ongoing performance of agents across the TheVHomes verified agent network.",
  },
  {
    initials: "CL",
    role: "Compliance & Legal Officer",
    description:
      "Ensures TheVHomes operates in line with Nigerian real estate regulations and upholds the highest standards of data protection and fair dealing.",
  },
  {
    initials: "MD",
    role: "Marketing Director",
    description:
      "Shapes how TheVHomes tells its story and connects with buyers, sellers, and investors across Nigeria.",
  },
];

export default function TeamPage() {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="Our Team"
      subtitle="A dedicated team working every day to make property transactions safer and more transparent."
    >
      <InfoSection title="The People Behind TheVHomes">
        <p>
          TheVHomes is powered by a small, focused team spanning technology, property verification,
          customer support, and agent relations. Each team member plays a direct role in making sure that
          when you use TheVHomes, you can trust what you see.
        </p>
      </InfoSection>

      <InfoGrid columns={3}>
        {team.map((member) => (
          <InfoCard key={member.role}>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-gradient text-lg font-display text-charcoal-950">
                {member.initials}
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-white">{member.role}</h3>
              <p className="mt-2 text-sm text-white/70">{member.description}</p>
            </div>
          </InfoCard>
        ))}
      </InfoGrid>
    </InfoPageShell>
  );
}
