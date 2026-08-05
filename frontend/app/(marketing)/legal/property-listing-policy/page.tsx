import type { Metadata } from "next";
import { InfoPageShell, InfoSection, InfoList } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Property Listing Policy",
  description:
    "Requirements and standards agents must follow when creating and publishing property listings on TheVHomes.",
};

export default function PropertyListingPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Property Listing Policy"
      subtitle="Standards every property listing on TheVHomes must meet before it goes live."
      lastUpdated="January 2025"
    >
      <InfoSection title="Who Can List a Property">
        <p>
          Only agents who have completed identity verification and hold an approved TVH-AGT-###### agent number may
          publish listings on TheVHomes. Unverified accounts can prepare draft listings, but publishing is disabled
          until approval is granted.
        </p>
      </InfoSection>

      <InfoSection title="Accuracy Requirements">
        <p>Every listing must accurately represent the property being offered. This means:</p>
        <InfoList
          items={[
            "Truthful, non-misleading descriptions of the property's condition and features",
            "Real photographs and video of the actual unit, not stock images or images of a different property",
            "Accurate pricing, including any mandatory fees or service charges",
            "Precise location information, including a correctly pinned map location",
          ]}
        />
      </InfoSection>

      <InfoSection title="Mandatory Listing Content">
        <p>Before a listing can be submitted for review, agents must provide:</p>
        <InfoList
          items={[
            "A minimum number of high-quality photos, including a designated cover image",
            "A complete list of amenities and property specifications",
            "An accurate, precisely placed map location",
            "A 3D property tour, generated prior to publishing",
          ]}
        />
      </InfoSection>

      <InfoSection title="Prohibited Listings">
        <InfoList
          items={[
            "Fraudulent listings for properties that do not exist or that the agent has no authority to list",
            "Properties that have already been sold, let, or booked",
            "Listings with deliberately misleading or bait pricing",
            "Duplicate listings for the same unit across multiple agent accounts",
          ]}
        />
      </InfoSection>

      <InfoSection title="Review Workflow">
        <p>
          Every listing moves through a structured review process before it becomes publicly visible:{" "}
          <strong className="text-white">Draft → Pending Review → Under Inspection → Verified or Rejected</strong>.
          During review, our admin team may also request specific changes, in which case the listing is returned to
          the agent for revision before resubmission.
        </p>
      </InfoSection>

      <InfoSection title="Consequences of Policy Violations">
        <p>
          Listings that violate this policy will be rejected or removed. Repeated or serious violations, including
          fraudulent listings, may result in suspension of an agent&apos;s ability to publish new listings, and in cases
          of repeat offenses, permanent termination of the agent&apos;s account.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
