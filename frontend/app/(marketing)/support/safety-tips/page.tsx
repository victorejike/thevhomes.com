import type { Metadata } from "next";
import { AlertTriangle, Eye, Lock, MessageSquareWarning, ShieldCheck, Video } from "lucide-react";
import { InfoPageShell, InfoSection, InfoList } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Safety Tips",
  description:
    "Practical guidance for staying safe while searching for, viewing, and transacting on properties through TheVHomes.",
};

export default function SafetyTipsPage() {
  return (
    <InfoPageShell
      eyebrow="Support"
      title="Safety Tips"
      subtitle="A few simple habits go a long way toward keeping your property search safe and stress-free."
    >
      <InfoSection title="Verify before you proceed" icon={ShieldCheck}>
        <p>
          TheVHomes verifies the identity of every agent and reviews every listing before it goes
          live. Before scheduling a viewing or making any payment, confirm the property and the
          agent both carry TheVHomes verification badges.
        </p>
        <InfoList
          items={[
            "Check for the verification badge on the agent's profile before engaging with them.",
            "Check for the verification badge on the listing page before booking a viewing.",
            "If a badge is missing or a profile looks incomplete, treat it with extra caution.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Keep payments on the platform" icon={Lock}>
        <p>
          All viewing fees and payments on TheVHomes are processed securely through Paystack or
          Flutterwave. We never ask you to send money directly to an agent, via bank transfer, or
          through any channel outside the platform.
        </p>
        <InfoList
          items={[
            "Never pay an agent directly outside the platform's booking and payment system.",
            "Be wary of anyone who insists on cash, bank transfer, or third-party payment apps.",
            "If in doubt about a payment request, contact our support team before sending anything.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Schedule viewings the right way" icon={Video}>
        <p>
          Always book viewings — physical or live-video — through TheVHomes rather than arranging
          to meet a stranger directly. This keeps a record of the appointment and connects you
          with a verified agent.
        </p>
        <InfoList
          items={[
            "Use the \"Book a Viewing\" option on a listing page rather than off-platform messaging.",
            "Prefer a live-video viewing first if you&apos;re unsure about traveling to an unfamiliar location.",
            "Bring a friend or family member along to physical viewings where possible.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Review the 3D tour first" icon={Eye}>
        <p>
          Where available, walk through a property&apos;s 3D tour before arranging an in-person visit.
          It helps you confirm the layout and condition match the listing description, and can
          save you an unnecessary trip.
        </p>
      </InfoSection>

      <InfoSection title="Protect your personal information" icon={MessageSquareWarning}>
        <p>
          Keep sensitive personal and financial details out of chat conversations with agents or
          other users.
        </p>
        <InfoList
          items={[
            "Avoid sharing your NIN, bank details, or passwords in chat messages.",
            "Keep communication about a listing within TheVHomes wherever possible.",
            "Report any request for information that feels unnecessary or suspicious.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Watch for red flags" icon={AlertTriangle}>
        <InfoList
          items={[
            "Pressure to pay immediately or \"before the property is gone.\"",
            "Prices that seem far below market value for the location and property type.",
            "Refusal to do a live-video call or in-person viewing before payment.",
            "Requests to communicate or pay entirely outside the TheVHomes platform.",
          ]}
        />
        <p>
          If you notice any of these signs, stop the conversation and report the listing or agent
          right away using our{" "}
          <a href="/support/report-property" className="text-teal-300 hover:text-teal-200">
            Report a Property
          </a>{" "}
          or{" "}
          <a href="/support/report-agent" className="text-teal-300 hover:text-teal-200">
            Report an Agent
          </a>{" "}
          forms. Our moderation team reviews every report and takes action where needed.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
