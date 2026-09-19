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
import { ModeTabs } from "@/components/mode-tabs";
import { ModeStatsChart } from "@/components/mode-stats-chart";
import { MatchDetailModal } from "@/components/match-detail-modal";
import type { ApiErrorResponse, PlayerApiResponse } from "@/lib/api-types";

const SAMPLE: SearchValue = { gameName: "Njoura", tagLine: "EUW", platform: "euw1" };

class ApiError extends Error {
  constructor(
    message: string,
    public code: ApiErrorResponse["code"],
    public retryAfterSeconds?: number,
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
    const retryAfter = res.status === 429 ? Number(res.headers.get("Retry-After") ?? "5") : undefined;
    throw new ApiError(body.error, body.code, retryAfter);
  }
  return res.json();
}

// Retrying immediately on a 4xx just piles more requests onto an already-rate-limited key
// (or asks Riot the same "not found" question again) — only worth retrying on our own
// transient server errors, and even then just once.
function shouldRetry(_failureCount: number, error: unknown) {
  if (error instanceof ApiError) return error.code === "SERVER_ERROR";
  return false;
}

export default function Home() {
  const [searched, setSearched] = useState<SearchValue>(SAMPLE);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeMode, setActiveMode] = useState("solo");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["player", searched],
    queryFn: () => fetchPlayer(searched),
    retry: shouldRetry,
  });

  // Cooldown deadline is derived from React Query's own error state, not a copy of it —
  // errorUpdatedAt is the moment the 429 landed, so no separate "when did this happen"
  // bookkeeping is needed.
  const rateLimitError =
    query.error instanceof ApiError && query.error.code === "RATE_LIMITED" ? query.error : null;
  const cooldownDeadline = rateLimitError
    ? query.errorUpdatedAt + (rateLimitError.retryAfterSeconds ?? 5) * 1000
    : null;

  // Seed the countdown from the deadline during render (React's documented pattern for
  // "reset state when a derived value changes" — no Date.now() call and no setState-in-effect
  // needed for this part), then only ever decrement it inside the interval's own callback.
  const [prevDeadline, setPrevDeadline] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  if (cooldownDeadline !== prevDeadline) {
    setPrevDeadline(cooldownDeadline);
    setCooldownSeconds(
      cooldownDeadline ? Math.max(0, Math.round((cooldownDeadline - query.errorUpdatedAt) / 1000)) : 0,
    );
  }

  const isCountingDown = cooldownSeconds > 0;
  useEffect(() => {
    if (!isCountingDown) return;
    const id = setInterval(() => setCooldownSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [isCountingDown]);

  function handleSearch(value: SearchValue) {
    setSearched(value);
    setHasSearched(true);
    setActiveMode("solo");
  }

  useEffect(() => {
    if (!query.isError) return;
    const err = query.error;
    const code = err instanceof ApiError ? err.code : "SERVER_ERROR";
    const message = err instanceof Error ? err.message : "Something went wrong.";

    if (code === "NOT_FOUND") {
      toast.error("No account found", { description: message });
    } else if (code === "RATE_LIMITED") {
      const seconds = err instanceof ApiError ? (err.retryAfterSeconds ?? 5) : 5;
      toast.warning("Riot's rate limit is tapped out", {
        description: `Try again in ~${seconds}s — search is locked until then so it doesn't dig the hole deeper.`,
      });
    } else if (code === "INVALID_INPUT") {
      toast.error("Check that Riot ID", { description: message });
    } else {
      toast.error("Couldn't load that player", { description: message });
    }
  }, [query.isError, query.error]);

  const activeModeData = query.data?.modes.find((m) => m.key === activeMode) ?? query.data?.modes[0];

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

      <SearchForm onSearch={handleSearch} isLoading={query.isFetching} cooldownSeconds={cooldownSeconds} />

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {query.isFetching && (
            <motion.div key="loading" exit={{ opacity: 0 }}>
              <LoadingState />
            </motion.div>
          )}

          {!query.isFetching && query.data && activeModeData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {!hasSearched && (
                <p className="text-center text-xs text-zinc-600">
                  Showing example data for {SAMPLE.gameName}#{SAMPLE.tagLine} — search your own Riot ID above.
                </p>
              )}

              <PlayerCard profile={query.data.profile} />
              <ModeTabs modes={query.data.modes} active={activeMode} onChange={setActiveMode} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMode}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {activeModeData.roast && <RoastCard roast={activeModeData.roast} />}
                  <ModeStatsChart matches={activeModeData.matches} />
                  <MatchList matches={activeModeData.matches} onSelect={setSelectedMatchId} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MatchDetailModal
        matchId={selectedMatchId}
        highlight={{ gameName: query.data?.profile.gameName ?? "", tagLine: query.data?.profile.tagLine ?? "" }}
        onClose={() => setSelectedMatchId(null)}
      />
    </main>
  );
}
