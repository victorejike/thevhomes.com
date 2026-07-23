"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * Next.js <Link> wrapped in Framer Motion so every navigational "button"
 * across the site gets the same tactile hover/tap feedback as native
 * <motion.button> elements, without losing client-side navigation.
 */
export const MotionLink = motion(Link);

// Shared spring presets so every interactive element feels consistent.
export const tapScale = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.94 } };
export const tapScaleSmall = { whileHover: { scale: 1.12 }, whileTap: { scale: 0.88 } };
export const cardLift = { whileHover: { y: -6, scale: 1.015 }, whileTap: { scale: 0.99 } };
