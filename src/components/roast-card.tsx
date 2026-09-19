"use client";

import { motion } from "framer-motion";
import type { RoastResult } from "@/lib/roast/engine";

const TONE_STYLES: Record<RoastResult["tone"], string> = {
  hype: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  tease: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  roast: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  sympathy: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  neutral: "border-zinc-400/20 bg-zinc-400/5 text-zinc-200",
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
      className={`rounded-2xl border p-5 ${TONE_STYLES[roast.tone]}`}
    >
      <p className="text-sm leading-relaxed">
        <span className="mr-2">{TONE_EMOJI[roast.tone]}</span>
        {roast.text}
      </p>
    </motion.div>
  );
}
