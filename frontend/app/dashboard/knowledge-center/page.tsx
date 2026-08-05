"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  Camera,
  ChevronDown,
  ClipboardList,
  Rocket,
  ShieldCheck,
  Sparkles,
  Video,
  View,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Topic {
  icon: LucideIcon;
  title: string;
  body: React.ReactNode;
}

const TOPICS: Topic[] = [
  {
    icon: Award,
    title: "How to Become an Approved Agent",
    body: (
      <>
        <p>Becoming a verified TheVHomes agent happens in two stages:</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            <strong className="text-white">Personal identity verification</strong> — complete NIN
            verification at{" "}
            <a href="/dashboard/verify" className="text-teal-300 underline">
              Identity Verification
            </a>
            .
          </li>
          <li>
            <strong className="text-white">Business application</strong> — submit your agency
            name, office address, government ID, profile photo, and (optionally) your CAC
            registration at{" "}
            <a href="/dashboard/agent-application" className="text-teal-300 underline">
              Agent Approval
            </a>
            .
          </li>
        </ol>
        <p className="mt-3">
          Once approved, you&apos;re issued a permanent, sequential agent number
          (<code className="text-teal-300">TVH-AGT-######</code>) — assigned exactly once and
          never reused. Only agents with an assigned agent number can publish listings.
        </p>
      </>
    ),
  },
  {
    icon: BadgeCheck,
    title: "Identity Verification",
    body: (
      <p>
        Every agent must pass NIN (National Identification Number) verification via VerifyMe
        before their business application can be reviewed. Your NIN is encrypted at rest and only
        the last 4 digits are ever shown — even to TheVHomes staff. This step exists to protect
        both you and every customer who books a viewing with you.
      </p>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Property Verification",
    body: (
      <p>
        Every listing goes through an admin review before it becomes publicly visible: photos,
        ownership documentation, location accuracy, listing details, and 3D tour quality are all
        checked. A listing can be moved to <strong className="text-white">Under Inspection</strong>,{" "}
        <strong className="text-white">Changes Requested</strong>, or fully{" "}
        <strong className="text-white">Verified</strong>. Verified listings display a trust badge
        that meaningfully increases buyer confidence — and booking rates.
      </p>
    ),
  },
  {
    icon: ClipboardList,
    title: "Listing Requirements",
    body: (
      <>
        <p>Every listing must include, at minimum:</p>
        <ul className="mt-3 space-y-1.5">
          <li>• A clear title, full description, property type, and purpose</li>
          <li>• An accurate price and whether it&apos;s negotiable</li>
          <li>• Full location details, including a precise map pin (latitude/longitude)</li>
          <li>• Bedrooms, bathrooms, toilets, parking, size, and year built (where applicable)</li>
          <li>• At least one amenity</li>
          <li>• A cover image plus your gallery photos</li>
        </ul>
        <p className="mt-3">
          A listing cannot be submitted for review until every required field for its property
          type is complete — the publishing form will tell you exactly what&apos;s missing.
        </p>
      </>
    ),
  },
  {
    icon: Camera,
    title: "Photo Requirements",
    body: (
      <>
        <p>
          Upload real, recent photos of the actual property — never stock photos or images of a
          different unit. We require a minimum number of images and enforce a maximum per
          listing. One image must be marked as the cover photo.
        </p>
        <p className="mt-3">
          TheVHomes automatically screens uploads for duplicate images (so you never accidentally
          upload the same photo twice), extremely low resolution, very dark/underexposed shots,
          and likely watermarks or screenshots — you&apos;ll see a warning before you submit if
          anything looks off.
        </p>
      </>
    ),
  },
  {
    icon: Video,
    title: "Video Requirements",
    body: (
      <p>
        Instead of uploading raw video files, upload your property walkthrough to YouTube first,
        then paste the YouTube link into the listing form. TheVHomes automatically validates the
        link, extracts the video ID, and embeds it directly on the property page with a
        privacy-enhanced player — visitors never leave TheVHomes to watch it.
      </p>
    ),
  },
  {
    icon: View,
    title: "3D Tour Requirements",
    body: (
      <p>
        Every listing needs an interactive 3D tour before it can be submitted for review. Scan
        each room with your phone camera (360° photos or a short video sweep per room) from the
        listing&apos;s &quot;Manage 3D Tour&quot; page. This is one of the biggest drivers of buyer
        confidence — listings with a completed tour convert to bookings at a meaningfully higher
        rate.
      </p>
    ),
  },
  {
    icon: Sparkles,
    title: "Best Practices",
    body: (
      <ul className="space-y-1.5">
        <li>• Respond to chat messages and booking requests promptly — response time affects your agent reputation score.</li>
        <li>• Keep pricing and availability up to date; remove or mark listings unavailable once sold or let.</li>
        <li>• Use natural light and wide-angle shots for photos; avoid clutter in frame.</li>
        <li>• Write honest, specific descriptions — vague or exaggerated copy increases rejection risk and buyer complaints.</li>
        <li>• Never ask customers to pay or communicate outside the platform — it voids TheVHomes&apos; protections for both of you.</li>
      </ul>
    ),
  },
  {
    icon: Rocket,
    title: "Publishing Workflow",
    body: (
      <p>
        Every listing moves through: <strong className="text-white">Draft</strong> →{" "}
        <strong className="text-white">Pending Review</strong> →{" "}
        <strong className="text-white">Under Inspection</strong> (optional) →{" "}
        <strong className="text-white">Changes Requested</strong> (if something needs fixing) →{" "}
        <strong className="text-white">Verified / Published</strong>. You&apos;ll get a
        notification at every step, and if changes are requested, the specific notes from the
        reviewer will be visible on your listing so you know exactly what to fix.
      </p>
    ),
  },
];

export default function KnowledgeCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-white">Agent Knowledge Center</h1>
      <p className="mt-1 text-white/50">
        Everything you need to become an approved agent and publish listings that convert.
      </p>

      <div className="mt-8 space-y-3">
        {TOPICS.map((topic, i) => {
          const open = openIndex === i;
          return (
            <div key={topic.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
                aria-expanded={open}
              >
                <span className="flex items-center gap-3">
                  <topic.icon size={18} className="shrink-0 text-teal-400" />
                  <span className="font-medium text-white">{topic.title}</span>
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} className="text-white/50" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-white/70">{topic.body}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
