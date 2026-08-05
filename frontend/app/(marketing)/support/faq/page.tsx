"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { InfoPageShell } from "@/components/info-page-shell";

const faqs = [
  {
    question: "How do I search for a property on TheVHomes?",
    answer:
      "Use the search bar on the homepage or the Properties page to filter listings by location, price range, property type, and number of bedrooms. Each result links to a full listing page with photos, a description, pricing, and — where available — a 3D tour.",
  },
  {
    question: "How does identity verification work?",
    answer:
      "We verify every buyer, tenant, and agent using their National Identification Number (NIN) through our integration with VerifyMe. Head to your dashboard's Verification page, submit your NIN, and we'll confirm your identity, usually within minutes.",
  },
  {
    question: "How do I book a viewing?",
    answer:
      "Open any property listing and click \"Book a Viewing.\" You can choose a physical, in-person viewing or a live-video viewing with the listing agent, then pick a date and time that works for you. You can track the status of every booking from your dashboard.",
  },
  {
    question: "What are viewing fees, and how are they paid?",
    answer:
      "Some listings charge a small viewing fee to confirm serious interest and deter no-shows. Fees are paid securely on the platform through Paystack or Flutterwave — we never ask you to pay an agent directly or outside the platform.",
  },
  {
    question: "How do I become an agent on TheVHomes?",
    answer:
      "First, complete personal identity verification with your NIN. Once verified, submit a business application with your agency details for review. After approval, you'll be issued an official TVH-AGT number (e.g. TVH-AGT-000123) that identifies you as a verified TheVHomes agent.",
  },
  {
    question: "How do 3D property tours work?",
    answer:
      "Many listings include an interactive 3D walkthrough so you can explore a property's layout and rooms from anywhere before scheduling an in-person visit. Look for the \"3D Tour\" badge on a listing to see if one is available.",
  },
  {
    question: "Can I save properties I'm interested in?",
    answer:
      "Yes. Click the heart/favorite icon on any listing to save it to your account. You can review all your saved properties anytime from the Favorites section of your dashboard.",
  },
  {
    question: "How do refunds work?",
    answer:
      "If a viewing is cancelled by the agent, or a listing turns out to be inaccurate or unavailable, you may be eligible for a refund of any fee paid. Refunds are reviewed case-by-case — see our Refund Policy for the full terms and how to request one.",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach our team at thevhomes@gmail.com or call +234 806 246 3468. For issues with a specific listing or agent, use the Report a Property or Report an Agent forms so our moderation team can investigate directly.",
  },
  {
    question: "How are listings verified?",
    answer:
      "Every listing submitted by an agent is reviewed by our team before it goes live, checking for accurate details, ownership or authorization documentation, and appropriate content. Verified listings display a verification badge on the property page.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "Not currently — TheVHomes website is fully responsive and designed to work smoothly on phones, tablets, and desktops, so there's no separate app required to search, book, or manage your account.",
  },
  {
    question: "How does the AI assistant work?",
    answer:
      "The AI assistant can help you find properties matching your criteria, answer questions about the platform, and point you to the right page or resource — think of it as a quick way to get guidance without digging through menus.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <InfoPageShell
      eyebrow="Support"
      title="Frequently Asked Questions"
      subtitle="Quick answers about searching, verification, bookings, payments, and more."
    >
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              className="rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-teal-400/30"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display text-sm font-semibold text-white sm:text-base">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-teal-400"
                >
                  <ChevronDown size={18} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm leading-relaxed text-white/60">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </InfoPageShell>
  );
}
