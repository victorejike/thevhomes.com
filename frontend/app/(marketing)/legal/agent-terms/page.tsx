import type { Metadata } from "next";
import { InfoPageShell, InfoSection, InfoList, InfoCard } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Agent Terms",
  description:
    "Terms governing verified agents on TheVHomes, including the TVH-AGT agent number, responsibilities, and performance standards.",
};

export default function AgentTermsPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Agent Terms"
      subtitle="Additional terms that apply to agents operating on the TheVHomes marketplace."
      lastUpdated="January 2025"
    >
      <InfoSection title="Eligibility to Become an Agent">
        <p>Before you can list and manage properties on TheVHomes, you must complete a two-step approval process:</p>
        <InfoList
          items={[
            "Personal identity verification using your National Identification Number (NIN)",
            "A business application, including CAC registration details, office address, and a valid means of identification",
          ]}
        />
        <p>Approval is granted only once both steps have been reviewed and confirmed by our team.</p>
      </InfoSection>

      <InfoSection title="Your Agent Number">
        <InfoCard title="TVH-AGT-######">
          <p>
            Upon approval, you are issued a permanent agent number in the format TVH-AGT-######. This number is
            unique to you, is issued only once, and is never reused or reassigned, even if your account is later
            suspended or terminated. It appears on your public agent profile and all listings you publish.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="Agent Responsibilities">
        <InfoList
          items={[
            "Respond to customer inquiries and booking requests promptly",
            "Honor confirmed viewing and booking commitments, or cancel with reasonable notice",
            "Keep listings accurate and up to date, including availability and pricing",
            "Conduct yourself professionally in all communication with customers and TheVHomes staff",
          ]}
        />
      </InfoSection>

      <InfoSection title="Fees and Commissions">
        <p>
          TheVHomes does not charge a fee to publish a listing. Our role is to facilitate viewings and bookings
          between you and prospective customers. Viewing fee splits are configured per listing, and any applicable
          service fees are disclosed transparently before a customer confirms a booking.
        </p>
      </InfoSection>

      <InfoSection title="Performance Standards">
        <p>
          To maintain a high-quality experience for customers, agent accounts are evaluated against performance
          standards including response time to inquiries, booking completion rate, and customer complaint rate.
          Consistently poor performance may reduce a listing&apos;s visibility in search results and affect your agent
          reputation score.
        </p>
      </InfoSection>

      <InfoSection title="Code of Conduct, Suspension & Disputes">
        <p>
          Agents are expected to act honestly and in good faith at all times. Grounds for suspension or termination
          include publishing fraudulent listings, repeated no-shows, harassment of customers, or attempts to bypass
          TheVHomes&apos; booking and payment systems. Where a dispute arises between an agent and a customer, both
          parties may request that our admin team review the matter and issue a resolution.
        </p>
        <p>
          For questions about your agent account, contact{" "}
          <a href="mailto:thevhomes@gmail.com" className="text-teal-400 hover:text-teal-300">
            thevhomes@gmail.com
          </a>{" "}
          or +234 806 246 3468.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
