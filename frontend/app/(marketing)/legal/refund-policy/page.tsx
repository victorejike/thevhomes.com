import type { Metadata } from "next";
import { InfoPageShell, InfoSection, InfoList } from "@/components/info-page-shell";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Understand when viewing fees, booking fees, and shortlet payments are refundable on TheVHomes, and how to request a refund.",
};

export default function RefundPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Refund Policy"
      subtitle="When and how refunds are issued for viewing fees, bookings, and shortlets."
      lastUpdated="January 2025"
    >
      <InfoSection title="Viewing Fee Refunds">
        <p>You are eligible for a full refund of a viewing fee when:</p>
        <InfoList
          items={[
            "The agent cancels the scheduled viewing",
            "The agent fails to show up at the agreed date and time",
            "The property is found to be materially misrepresented or unavailable upon arrival",
          ]}
        />
        <p>
          Refund requests for viewing fees must be submitted within 7 days of the scheduled viewing date via the
          &quot;My Viewings&quot; section of your dashboard.
        </p>
      </InfoSection>

      <InfoSection title="Booking & Reservation Fee Refunds">
        <p>
          Booking or reservation fees paid to secure a property (for purchase or long-term rental) are refundable
          only where the agent or property owner is unable to honor the reservation, or where a listing is withdrawn
          after a reservation fee has been paid. Refunds are reviewed on a case-by-case basis by our admin team.
        </p>
      </InfoSection>

      <InfoSection title="Shortlet Booking Cancellations">
        <p>
          Shortlet bookings follow the cancellation window displayed at the time of booking on each listing.
          Cancellations made within the eligible window receive a full or partial refund depending on the property&apos;s
          stated policy; cancellations made after the window has closed, or no-shows, are not refundable.
        </p>
      </InfoSection>

      <InfoSection title="Processing Time">
        <p>
          Approved refunds are returned to your original payment method via Paystack or Flutterwave and typically
          take 5 to 10 business days to reflect, depending on your bank or card issuer.
        </p>
      </InfoSection>

      <InfoSection title="Non-Refundable Circumstances">
        <InfoList
          items={[
            "Customer no-shows for a confirmed viewing appointment",
            "Change of mind after a viewing has been successfully completed",
            "Bookings canceled outside the eligible cancellation window",
          ]}
        />
      </InfoSection>

      <InfoSection title="How to Request a Refund">
        <p>
          To request a refund, go to &quot;My Viewings&quot; or &quot;My Bookings&quot; in your dashboard and select
          the relevant transaction, or email{" "}
          <a href="mailto:thevhomes@gmail.com" className="text-teal-400 hover:text-teal-300">
            thevhomes@gmail.com
          </a>{" "}
          with your booking reference. If you disagree with the outcome of a refund decision, you may escalate the
          matter for review by our admin team, who will assess the case and issue a final determination.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
