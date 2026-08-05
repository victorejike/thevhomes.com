import type { Metadata } from "next";
import { Sparkles, Building2, Mail } from "lucide-react";
import { InfoPageShell, InfoSection, InfoCard, InfoGrid } from "@/components/info-page-shell";
import { MotionLink } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join THE VHOMES LIMITED and help build the most trusted verified property marketplace in Nigeria.",
};

const departments = [
  {
    name: "Engineering",
    description: "Build and scale the platform powering identity verification, listings, and 3D property tours.",
  },
  {
    name: "Property Verification",
    description: "Confirm the accuracy and legitimacy of listings and property documentation nationwide.",
  },
  {
    name: "Customer Success",
    description: "Guide buyers, renters, and investors through every step of their TheVHomes experience.",
  },
  {
    name: "Sales & Agent Relations",
    description: "Grow and manage our network of vetted, verified real estate agents across Nigeria.",
  },
  {
    name: "Marketing",
    description: "Tell the TheVHomes story and connect our platform with the people who need it most.",
  },
];

export default function CareersPage() {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="Careers at TheVHomes"
      subtitle="Help us build the most trusted property marketplace in Nigeria."
    >
      <InfoSection title="Our Culture" icon={Sparkles}>
        <p>
          TheVHomes is a mission-driven, fast-growing proptech company solving a problem that affects
          millions of Nigerians: the lack of trust in real estate transactions. We move quickly, care deeply
          about the details, and hold ourselves to a high standard — because the decisions our users make on
          our platform are some of the biggest financial decisions of their lives.
        </p>
      </InfoSection>

      <InfoSection title="Why Work With Us">
        <p>
          Joining TheVHomes means working on problems with real, tangible impact — helping a family find a
          safe home, helping a diaspora investor buy property with confidence, or helping an honest agent
          grow their business. Our team is based in Abuja with a hybrid way of working, and we support
          remote collaboration for roles where it makes sense.
        </p>
      </InfoSection>

      <InfoSection title="Departments Hiring" icon={Building2}>
        <InfoGrid columns={3}>
          {departments.map((dept) => (
            <InfoCard key={dept.name} title={dept.name}>
              <p className="text-sm text-white/70">{dept.description}</p>
            </InfoCard>
          ))}
        </InfoGrid>
      </InfoSection>

      <InfoSection title="How to Apply" icon={Mail}>
        <p>
          We don&apos;t yet have a live job board, so applications are reviewed on a rolling basis. If
          you&apos;re interested in joining TheVHomes, send your CV to{" "}
          <a href="mailto:thevhomes@gmail.com" className="text-teal-400 hover:text-teal-300">
            thevhomes@gmail.com
          </a>{" "}
          along with the department or role you&apos;re interested in, and a short note on why you&apos;d be
          a great fit. We review every application personally and will reach out if there&apos;s a match.
        </p>
        <MotionLink
          href="mailto:thevhomes@gmail.com"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-2 inline-block rounded-full bg-teal-gradient px-6 py-3 text-sm font-semibold text-charcoal-950"
        >
          Send Your CV
        </MotionLink>
      </InfoSection>
    </InfoPageShell>
  );
}
