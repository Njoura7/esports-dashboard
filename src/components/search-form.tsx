"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/riot/constants";

export interface SearchValue {
  gameName: string;
  tagLine: string;
  platform: Platform;
}

export function SearchForm({
  onSearch,
  isLoading,
}: {
  onSearch: (value: SearchValue) => void;
  isLoading: boolean;
}) {
  const [riotId, setRiotId] = useState("");
  const [platform, setPlatform] = useState<Platform>("na1");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const [gameName, tagLine] = riotId.split("#").map((s) => s.trim());
    if (!gameName || !tagLine) {
      toast.error("Check that Riot ID", { description: "Format is gameName#tagLine, e.g. Faker#KR1" });
      return;
    }
    onSearch({ gameName, tagLine, platform });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:flex-row sm:items-center">
        <input
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="RiotID#Tag  (e.g. Faker#KR1)"
          className="flex-1 rounded-2xl bg-transparent px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 outline-none"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400/60"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p} className="bg-zinc-900">
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-2xl bg-violet-500 px-6 py-3 font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}
