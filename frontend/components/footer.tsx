"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { MotionLink } from "./motion-link";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/properties?purpose=buy", label: "Buy a Home" },
      { href: "/properties?purpose=rent", label: "Rent a Home" },
      { href: "/properties?purpose=shortlet", label: "Shortlets" },
      { href: "/investments", label: "Investments" },
    ],
  },
  {
    title: "TheVHomes",
    links: [
      { href: "/agents", label: "Find an Agent" },
      { href: "/dashboard", label: "My Dashboard" },
      { href: "/register?role=agent", label: "Become an Agent" },
      { href: "/about", label: "About Us" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQs" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-charcoal-950 text-white/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <span className="font-display text-2xl font-semibold text-white">
            THE<span className="text-teal-400">V</span>HOMES
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Premium real estate marketplace and property management platform
            connecting discerning clients to Nigeria&apos;s finest homes,
            shortlets, and investment opportunities.
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-teal-400" /> Abuja, Nigeria
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-teal-400" />
              <a href="tel:+2348062463468" className="transition hover:text-teal-300">
                +234 806 246 3468
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-teal-400" />
              <a href="mailto:thevhomes@gmail.com" className="transition hover:text-teal-300">
                thevhomes@gmail.com
              </a>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.15, y: -3, rotate: 6 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition hover:border-teal-400/50 hover:text-teal-300"
              >
                <Icon size={16} />
              </motion.a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <MotionLink
                    href={link.href}
                    whileHover={{ x: 4 }}
                    className="inline-block transition hover:text-teal-300"
                  >
                    {link.label}
                  </MotionLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} THE VHOMES LIMITED. All rights reserved.
      </div>
    </footer>
  );
}
