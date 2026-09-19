"use client";

import { motion } from "framer-motion";
import type { MatchResponse } from "@/lib/api-types";
import { MatchCard } from "./match-card";

export function MatchList({ matches }: { matches: MatchResponse[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-zinc-500">No recent games found.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {matches.map((match, i) => (
        <motion.div
          key={match.matchId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
        >
          <MatchCard match={match} />
        </motion.div>
      ))}
    </div>
  );
}
