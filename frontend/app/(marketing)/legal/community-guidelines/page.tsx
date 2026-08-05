import type { Metadata } from "next";
import { InfoPageShell, InfoSection, InfoList } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description:
    "The standards of behavior expected from everyone using TheVHomes, including customers and agents.",
};

export default function CommunityGuidelinesPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Community Guidelines"
      subtitle="How we expect everyone on TheVHomes to treat one another."
      lastUpdated="January 2025"
    >
      <InfoSection title="Respectful Communication">
        <p>
          TheVHomes is a community of buyers, renters, investors, and agents working toward the same goal: finding
          the right property. We expect respectful communication in every chat message, review, and agent profile
          interaction on the platform.
        </p>
      </InfoSection>

      <InfoSection title="Zero Tolerance Policy">
        <p>
          We have zero tolerance for hate speech, harassment, threats, or discrimination based on ethnicity, religion,
          gender, disability, or any other personal characteristic. Any user found engaging in such behavior will
          face immediate account review and potential suspension.
        </p>
      </InfoSection>

      <InfoSection title="Honesty in Reviews and Listings">
        <InfoList
          items={[
            "Reviews must reflect a genuine experience with a property, agent, or booking",
            "Property information shared in chat must match what is published on the listing",
            "Fake reviews, review manipulation, or coordinated rating campaigns are not permitted",
          ]}
        />
      </InfoSection>

      <InfoSection title="No Spam, Scams, or Bypassing the Platform">
        <p>
          Sharing personal contact details in order to move a viewing, booking, or payment outside of TheVHomes is
          not permitted. This protects both parties: it ensures bookings are tracked, payments are secure, and
          disputes can be fairly resolved through our support and admin review process.
        </p>
      </InfoSection>

      <InfoSection title="Reporting a Problem">
        <p>
          If you encounter a listing or agent that violates these guidelines, please use our reporting tools rather
          than confronting the other party directly:
        </p>
        <InfoList
          items={[
            "Report a Property at /support/report-property",
            "Report an Agent at /support/report-agent",
          ]}
        />
      </InfoSection>

      <InfoSection title="How Moderation Works">
        <p>
          Reported content is reviewed by our team. Rather than automatically deleting content the moment it is
          reported, high-confidence violations are queued for admin review to ensure decisions are fair and
          accurate. Consequences for confirmed violations range from content removal and formal warnings to
          temporary or permanent account suspension, depending on the severity and frequency of the behavior.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
