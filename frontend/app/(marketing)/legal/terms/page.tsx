import type { Metadata } from "next";
import { InfoPageShell, InfoSection, InfoList } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms and conditions governing your use of TheVHomes property marketplace, including agent obligations, payments, and liability.",
};

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Terms & Conditions"
      subtitle="The rules that govern your use of the TheVHomes platform."
      lastUpdated="January 2025"
    >
      <InfoSection title="Acceptance of Terms">
        <p>
          By creating an account, browsing listings, or booking a viewing on TheVHomes, you agree to be bound by
          these Terms & Conditions. If you do not agree, please do not use the platform. THE VHOMES LIMITED may
          update these terms from time to time, and continued use of the platform after changes take effect
          constitutes acceptance of the revised terms.
        </p>
      </InfoSection>

      <InfoSection title="Eligibility and Account Registration">
        <p>
          You must be at least 18 years old and capable of entering into a binding contract under Nigerian law to use
          TheVHomes. When registering, you agree to provide accurate, current, and complete information, and to keep
          your account details up to date. You are responsible for maintaining the confidentiality of your login
          credentials and for all activity that occurs under your account.
        </p>
      </InfoSection>

      <InfoSection title="Agent Obligations">
        <p>Agents wishing to publish listings on TheVHomes must complete verification before doing so, including:</p>
        <InfoList
          items={[
            "Personal identity verification via National Identification Number (NIN)",
            "Business application review, including CAC documentation and office address confirmation",
            "Issuance of a permanent TVH-AGT-###### agent number upon approval",
            "Ongoing accuracy of all published listings, pricing, and availability",
          ]}
        />
      </InfoSection>

      <InfoSection title="Prohibited Conduct">
        <p>You agree not to engage in any of the following while using TheVHomes:</p>
        <InfoList
          items={[
            "Publishing fraudulent, duplicate, or misleading property listings",
            "Impersonating another person, agent, or business",
            "Harassing, threatening, or discriminating against other users",
            "Attempting to bypass the platform's booking or payment systems",
            "Uploading content that infringes on the intellectual property of others",
          ]}
        />
      </InfoSection>

      <InfoSection title="Payments">
        <p>
          Viewing fees and booking fees are processed securely through Paystack or Flutterwave. Except as described
          in our{" "}
          <a href="/legal/refund-policy" className="text-teal-400 hover:text-teal-300">
            Refund Policy
          </a>
          , payments made through the platform are non-refundable. TheVHomes does not store your full card or bank
          details; this is handled entirely by our licensed payment processors.
        </p>
      </InfoSection>

      <InfoSection title="Intellectual Property">
        <p>
          All content on TheVHomes, including the platform&apos;s design, logo, text, and software, is the property
          of THE VHOMES LIMITED or its licensors and may not be copied, reproduced, or distributed without
          permission. Photos, floor plans, and 3D tours uploaded by agents remain subject to the rights of their
          respective owners, who represent that they have the right to publish such content on the platform.
        </p>
      </InfoSection>

      <InfoSection title="Limitation of Liability">
        <p>
          TheVHomes provides a platform that facilitates connections between buyers, renters, investors, and agents.
          We are not a party to, and do not guarantee, the outcome of any property transaction, tenancy agreement, or
          sale negotiated between users. To the fullest extent permitted by law, TheVHomes is not liable for
          disputes, losses, or damages arising from transactions conducted between users of the platform.
        </p>
      </InfoSection>

      <InfoSection title="Termination, Governing Law & Disputes">
        <p>
          We may suspend or terminate accounts that violate these terms, including repeated policy breaches or
          fraudulent activity. These Terms & Conditions are governed by the laws of the Federal Republic of Nigeria.
          Any disputes arising from use of the platform will first be addressed through good-faith negotiation, and
          if unresolved, may be referred to the courts of competent jurisdiction in Nigeria.
        </p>
        <p>
          Questions about these terms may be directed to{" "}
          <a href="mailto:thevhomes@gmail.com" className="text-teal-400 hover:text-teal-300">
            thevhomes@gmail.com
          </a>{" "}
          or +234 806 246 3468.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
