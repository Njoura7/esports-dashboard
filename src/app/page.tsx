"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SearchForm, type SearchValue } from "@/components/search-form";
import { LoadingState } from "@/components/loading-state";
import { PlayerCard } from "@/components/player-card";
import { MatchList } from "@/components/match-list";
import { RoastCard } from "@/components/roast-card";
import { IdleGlow } from "@/components/idle-glow";
import type { ApiErrorResponse, PlayerApiResponse } from "@/lib/api-types";

class ApiError extends Error {
  constructor(
    message: string,
    public code: ApiErrorResponse["code"],
  ) {
    super(message);
  }
}

async function fetchPlayer(value: SearchValue): Promise<PlayerApiResponse> {
  const params = new URLSearchParams({
    gameName: value.gameName,
    tagLine: value.tagLine,
    platform: value.platform,
  });
  const res = await fetch(`/api/player?${params}`);
  if (!res.ok) {
    const body: ApiErrorResponse = await res
      .json()
      .catch(() => ({ error: "Request failed.", code: "SERVER_ERROR" as const }));
    throw new ApiError(body.error, body.code);
  }
  return res.json();
}

export default function Home() {
  const [searched, setSearched] = useState<SearchValue | null>(null);

  const query = useQuery({
    queryKey: ["player", searched],
    queryFn: () => fetchPlayer(searched!),
    enabled: searched !== null,
  });

  useEffect(() => {
    if (!query.isError) return;
    const err = query.error;
    const code = err instanceof ApiError ? err.code : "SERVER_ERROR";
    const message = err instanceof Error ? err.message : "Something went wrong.";

    if (code === "NOT_FOUND") {
      toast.error("No account found", { description: message });
    } else if (code === "RATE_LIMITED") {
      toast.warning("Slow down a sec", { description: message });
    } else if (code === "INVALID_INPUT") {
      toast.error("Check that Riot ID", { description: message });
    } else {
      toast.error("Couldn't load that player", { description: message });
    }
  }, [query.isError, query.error]);

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Rift Report
        </h1>
        <p className="text-sm text-zinc-500">Drop a Riot ID. We&apos;ll pull the receipts.</p>
      </motion.div>

      <SearchForm onSearch={setSearched} isLoading={query.isFetching} />

      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          {searched === null && (
            <motion.div key="idle" exit={{ opacity: 0 }}>
              <IdleGlow />
            </motion.div>
          )}

          {query.isFetching && (
            <motion.div key="loading" exit={{ opacity: 0 }}>
              <LoadingState />
            </motion.div>
          )}

          {!query.isFetching && query.data && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <PlayerCard profile={query.data.profile} />
              {query.data.roast && <RoastCard roast={query.data.roast} />}
              <MatchList matches={query.data.matches} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
