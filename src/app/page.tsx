"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { SearchForm, type SearchValue } from "@/components/search-form";
import { LoadingState } from "@/components/loading-state";
import { PlayerCard } from "@/components/player-card";
import { MatchList } from "@/components/match-list";
import { RoastCard } from "@/components/roast-card";
import type { ApiErrorResponse, PlayerApiResponse } from "@/lib/api-types";

async function fetchPlayer(value: SearchValue): Promise<PlayerApiResponse> {
  const params = new URLSearchParams({
    gameName: value.gameName,
    tagLine: value.tagLine,
    platform: value.platform,
  });
  const res = await fetch(`/api/player?${params}`);
  if (!res.ok) {
    const body: ApiErrorResponse = await res.json().catch(() => ({ error: "Request failed." }));
    throw new Error(body.error);
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

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16 sm:py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Rift Report
        </h1>
        <p className="max-w-md text-sm text-zinc-400">
          Search a Riot ID, see the last 10 games, and get a completely unsolicited opinion
          about them.
        </p>
      </div>

      <SearchForm onSearch={setSearched} isLoading={query.isFetching} />

      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          {query.isFetching && (
            <motion.div key="loading" exit={{ opacity: 0 }}>
              <LoadingState />
            </motion.div>
          )}

          {!query.isFetching && query.isError && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-300"
            >
              {(query.error as Error).message}
            </motion.p>
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
