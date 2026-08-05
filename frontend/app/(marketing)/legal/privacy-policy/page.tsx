import type { Metadata } from "next";
import { InfoPageShell, InfoSection, InfoList, InfoCard } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how TheVHomes collects, uses, and protects your personal data, including identity verification information.",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How THE VHOMES LIMITED collects, uses, and safeguards your personal data."
      lastUpdated="January 2025"
    >
      <InfoSection title="Information We Collect">
        <p>
          To operate Nigeria&apos;s premium property marketplace, TheVHomes collects information that helps us
          connect buyers, renters, and investors with verified agents and accurate listings. This includes:
        </p>
        <InfoList
          items={[
            "Account details such as your name, email address, and phone number",
            "National Identification Number (NIN) submitted for identity verification",
            "Payment metadata processed through Paystack or Flutterwave (we never store full card details)",
            "Browsing and search behavior, including saved properties, viewed listings, and booking history",
            "Cookies and similar technologies, as described in our Cookie Policy",
            "Communications you send us, including support requests and chat messages with agents",
          ]}
        />
        <p>
          Our use of cookies and similar tracking technologies is governed separately by our{" "}
          <a href="/legal/cookie-policy" className="text-teal-400 hover:text-teal-300">
            Cookie Policy
          </a>
          .
        </p>
      </InfoSection>

      <InfoSection title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <InfoList
          items={[
            "Match you with relevant properties, agents, and investment opportunities",
            "Verify the identity of agents and customers through our partner VerifyMe, reducing fraud on the platform",
            "Process viewing bookings, shortlet reservations, and payments securely",
            "Improve our matching algorithms, search experience, and 3D property tours",
            "Send booking confirmations, verification updates, and important account notices",
            "Detect, investigate, and prevent fraudulent listings or transactions",
          ]}
        />
      </InfoSection>

      <InfoSection title="How We Protect Your NIN">
        <InfoCard title="Identity data is handled with strict controls">
          <p>
            National Identification Numbers submitted for verification are encrypted at rest and in transit. Once
            verification is complete, only the last four digits of your NIN are ever displayed within your dashboard
            or to TheVHomes staff performing support functions. Full NIN values are never shared with agents,
            customers, or third parties other than our verification processor, VerifyMe, which is bound by its own
            confidentiality and data protection obligations.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="Sharing Your Information">
        <p>
          TheVHomes does not sell your personal data. We share information only in the following limited
          circumstances:
        </p>
        <InfoList
          items={[
            "With payment processors Paystack and Flutterwave, solely to process viewing fees and bookings",
            "With VerifyMe, solely to confirm the authenticity of identity documents",
            "With agents, limited to the information necessary to arrange a viewing or booking you have requested",
            "When required by law, court order, or to protect the rights and safety of TheVHomes and its users",
          ]}
        />
      </InfoSection>

      <InfoSection title="Your Rights and Data Retention">
        <p>
          You may request access to, correction of, or deletion of your personal data at any time by writing to{" "}
          <a href="mailto:thevhomes@gmail.com" className="text-teal-400 hover:text-teal-300">
            thevhomes@gmail.com
          </a>
          . We retain account and transaction data for as long as your account is active, and for a reasonable period
          afterward to comply with legal, tax, and fraud-prevention obligations. TheVHomes is not directed at
          children under 18, and we do not knowingly collect data from minors.
        </p>
      </InfoSection>

      <InfoSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal
          requirements. Material changes will be communicated via email or an in-app notice. If you have questions
          about this policy, please contact us at{" "}
          <a href="mailto:thevhomes@gmail.com" className="text-teal-400 hover:text-teal-300">
            thevhomes@gmail.com
          </a>{" "}
          or call +234 806 246 3468.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
