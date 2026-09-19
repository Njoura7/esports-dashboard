"use client";

import { motion } from "framer-motion";
import type { RoastResult } from "@/lib/roast/engine";

const TONE_STYLES: Record<RoastResult["tone"], string> = {
  hype: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100",
  tease: "border-amber-400/20 bg-amber-400/[0.06] text-amber-100",
  roast: "border-rose-400/20 bg-rose-400/[0.06] text-rose-100",
  sympathy: "border-sky-400/20 bg-sky-400/[0.06] text-sky-100",
  neutral: "border-zinc-400/15 bg-zinc-400/[0.04] text-zinc-200",
};

const TONE_EMOJI: Record<RoastResult["tone"], string> = {
  hype: "🔥",
  tease: "😏",
  roast: "💀",
  sympathy: "🫂",
  neutral: "🙂",
};

export function RoastCard({ roast }: { roast: RoastResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-3xl border p-5 backdrop-blur-xl ${TONE_STYLES[roast.tone]}`}
    >
      <p className="text-sm leading-relaxed">
        <span className="mr-2">{TONE_EMOJI[roast.tone]}</span>
        {roast.text}
      </p>
    </motion.div>
  );
}
