"use client";

import { motion } from "framer-motion";
import type { ModeResponse } from "@/lib/api-types";

export function ModeTabs({
  modes,
  active,
  onChange,
}: {
  modes: ModeResponse[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
      {modes.map((mode) => {
        const isActive = mode.key === active;
        return (
          <button
            key={mode.key}
            onClick={() => onChange(mode.key)}
            className={`relative flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="mode-tab-pill"
                className="absolute inset-0 rounded-xl bg-violet-500"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              {mode.label}
              <span className={`text-xs ${isActive ? "text-violet-100" : "text-zinc-600"}`}>
                {mode.matches.length}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
