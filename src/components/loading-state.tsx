"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const STEPS = [
  "Resolving Riot ID…",
  "Pulling summoner profile…",
  "Fetching last 10 games…",
  "Judging your champion pool…",
];

export function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 py-16">
      <div className="relative h-16 w-16">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-violet-400/30"
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-t-violet-400 border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.p
        key={stepIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-sm text-zinc-400"
      >
        {STEPS[stepIndex]}
      </motion.p>
    </div>
  );
}
