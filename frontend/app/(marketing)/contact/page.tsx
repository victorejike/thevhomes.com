import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, LifeBuoy } from "lucide-react";
import { InfoPageShell, InfoSection, InfoCard, InfoGrid, InfoList } from "@/components/info-page-shell";
import { MotionLink } from "@/components/motion-link";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with THE VHOMES LIMITED in Abuja, Nigeria — office address, phone, email, and support guidance.",
};

export default function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Company"
      title="Contact Us"
      subtitle="We're here to help with anything from a general enquiry to a property or agent concern."
    >
      <InfoGrid columns={3}>
        <InfoCard title="Office Address">
          <div className="flex items-start gap-2.5 text-white/70">
            <MapPin size={18} className="mt-0.5 shrink-0 text-teal-400" />
            <span>Abuja, Nigeria</span>
          </div>
        </InfoCard>
        <InfoCard title="Phone">
          <div className="flex items-start gap-2.5 text-white/70">
            <Phone size={18} className="mt-0.5 shrink-0 text-teal-400" />
            <a href="tel:+2348062463468" className="hover:text-teal-300">
              +234 806 246 3468
            </a>
          </div>
        </InfoCard>
        <InfoCard title="Email">
          <div className="flex items-start gap-2.5 text-white/70">
            <Mail size={18} className="mt-0.5 shrink-0 text-teal-400" />
            <a href="mailto:thevhomes@gmail.com" className="hover:text-teal-300">
              thevhomes@gmail.com
            </a>
          </div>
        </InfoCard>
      </InfoGrid>

      <InfoSection title="Business Hours" icon={Clock}>
        <p>Our team is available Monday through Saturday, 9:00am – 6:00pm WAT. We aim to respond to all enquiries within one business day.</p>
      </InfoSection>

      <InfoSection title="Get Support Faster" icon={LifeBuoy}>
        <p>
          To make sure your message reaches the right team as quickly as possible, please use the channel
          that matches your need:
        </p>
        <InfoList
          items={[
            "Identity verification issues — visit your Verification dashboard to check status or resubmit documents.",
            "Property or listing complaints — report the property directly so our verification team can investigate.",
            "Agent conduct or complaints — report the agent so our agent relations team can review the account.",
            "General enquiries, partnerships, or press — email us at thevhomes@gmail.com.",
          ]}
        />
        <div className="flex flex-wrap gap-3 pt-2">
          <MotionLink
            href="/dashboard/verify"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-white hover:border-teal-400/30"
          >
            Verify My Identity
          </MotionLink>
          <MotionLink
            href="/support/report-property"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-white hover:border-teal-400/30"
          >
            Report a Property
          </MotionLink>
          <MotionLink
            href="/support/report-agent"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-white hover:border-teal-400/30"
          >
            Report an Agent
          </MotionLink>
        </div>
      </InfoSection>
    </InfoPageShell>
  );
}
