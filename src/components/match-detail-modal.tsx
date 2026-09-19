"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MODES } from "@/lib/riot/constants";
import type { ApiErrorResponse, MatchDetailResponse, MatchParticipantResponse } from "@/lib/api-types";

const ROLE_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

async function fetchMatchDetail(matchId: string): Promise<MatchDetailResponse> {
  const res = await fetch(`/api/match/${matchId}`);
  if (!res.ok) {
    const body: ApiErrorResponse = await res
      .json()
      .catch(() => ({ error: "Couldn't load match details.", code: "SERVER_ERROR" as const }));
    throw new Error(body.error);
  }
  return res.json();
}

function isHighlighted(
  p: MatchParticipantResponse,
  highlight: { gameName: string; tagLine: string },
) {
  return (
    p.gameName.toLowerCase() === highlight.gameName.toLowerCase() &&
    p.tagLine.toLowerCase() === highlight.tagLine.toLowerCase()
  );
}

function kda(k: number, d: number, a: number) {
  return d === 0 ? "Perfect" : ((k + a) / d).toFixed(2);
}

function TeamPanel({
  teamId,
  win,
  objectives,
  participants,
  highlight,
}: {
  teamId: number;
  win: boolean;
  objectives: MatchDetailResponse["teams"][number]["objectives"];
  participants: MatchParticipantResponse[];
  highlight: { gameName: string; tagLine: string };
}) {
  const sorted = [...participants].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );

  return (
    <div
      className={`flex flex-1 flex-col gap-2 rounded-2xl border p-3 ${
        teamId === 100
          ? "border-sky-400/20 bg-sky-500/[0.04]"
          : "border-rose-400/20 bg-rose-500/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${win ? "text-emerald-400" : "text-rose-400"}`}>
          {teamId === 100 ? "Blue Side" : "Red Side"} — {win ? "Victory" : "Defeat"}
        </p>
        <p className="text-xs text-zinc-500">
          {objectives.towerKills} towers · {objectives.dragonKills} drakes · {objectives.baronKills}{" "}
          barons · {objectives.inhibitorKills} inhibs
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {sorted.map((p) => {
          const hl = isHighlighted(p, highlight);
          return (
            <div
              key={`${p.gameName}#${p.tagLine}`}
              className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${
                hl ? "border border-violet-400/40 bg-violet-500/10" : "border border-transparent"
              }`}
            >
              <div className="relative">
                <Image
                  src={p.championIconUrl}
                  alt={p.championName}
                  width={32}
                  height={32}
                  className="rounded-lg"
                  unoptimized
                />
                <span className="absolute -bottom-1 -right-1 rounded bg-zinc-900 px-1 text-[9px] font-medium text-zinc-300">
                  {p.champLevel}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-100">
                  {p.gameName}
                  {hl && <span className="ml-1 text-violet-400">(you)</span>}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {p.kills}/{p.deaths}/{p.assists} · {kda(p.kills, p.deaths, p.assists)} KDA
                </p>
              </div>

              <div className="hidden shrink-0 gap-0.5 sm:flex">
                {p.itemIconUrls.map((url, i) =>
                  url ? (
                    <Image
                      key={i}
                      src={url}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded"
                      unoptimized
                    />
                  ) : (
                    <div key={i} className="h-5 w-5 rounded bg-white/5" />
                  ),
                )}
              </div>

              <div className="w-16 shrink-0 text-right text-[11px] text-zinc-400">
                <p>{Math.round(p.damageDealt / 100) / 10}k dmg</p>
                <p className="text-amber-400/70">{Math.round(p.goldEarned / 100) / 10}k gold</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MatchDetailModal({
  matchId,
  highlight,
  onClose,
}: {
  matchId: string | null;
  highlight: { gameName: string; tagLine: string };
  onClose: () => void;
}) {
  useEffect(() => {
    if (!matchId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [matchId, onClose]);

  const query = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => fetchMatchDetail(matchId!),
    enabled: matchId !== null,
  });

  return (
    <AnimatePresence>
      {matchId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900/95 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-100">
                {query.data
                  ? MODES.find((m) => m.queueId === query.data!.queueId)?.label ?? query.data.gameMode
                  : "Match details"}
                {query.data && (
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    {Math.round(query.data.gameDurationSeconds / 60)} min
                  </span>
                )}
              </p>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {query.isFetching && (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
              </div>
            )}

            {query.isError && (
              <p className="py-6 text-center text-sm text-rose-400">
                {(query.error as Error).message}
              </p>
            )}

            {query.data && (
              <div className="flex flex-col gap-3">
                {query.data.teams.map((team) => (
                  <TeamPanel
                    key={team.teamId}
                    teamId={team.teamId}
                    win={team.win}
                    objectives={team.objectives}
                    participants={query.data!.participants.filter((p) => p.teamId === team.teamId)}
                    highlight={highlight}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
