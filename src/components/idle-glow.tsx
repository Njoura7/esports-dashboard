"use client";

import { motion } from "framer-motion";

// What sits in the results area before anyone has searched. Purely ambient —
// gives the empty state some life instead of a dead void under the search bar.
export function IdleGlow() {
  return (
    <div className="flex flex-col items-center gap-5 py-16 opacity-80">
      <div className="relative h-20 w-20">
        {[0, 0.6, 1.2].map((delay) => (
          <motion.span
            key={delay}
            className="absolute inset-0 rounded-full border border-violet-400/25"
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 2.4, delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-violet-400/60 to-fuchsia-400/40 blur-[2px]" />
      </div>
      <p className="text-xs tracking-wide text-zinc-600">waiting on a name…</p>
    </div>
  );
}
