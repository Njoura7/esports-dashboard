// Data Dragon: static assets, no API key, safe to call straight from the client too.
// We only use this server-side to resolve the current patch version once per request;
// the browser hits the CDN directly for images.

const DDRAGON_CDN = "https://ddragon.leagueoflegends.com/cdn";

let cachedVersion: { value: string; fetchedAt: number } | null = null;
const VERSION_TTL_MS = 60 * 60 * 1000; // patches don't drop more than once a day

export async function getLatestVersion(): Promise<string> {
  if (cachedVersion && Date.now() - cachedVersion.fetchedAt < VERSION_TTL_MS) {
    return cachedVersion.value;
  }
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
    next: { revalidate: 3600 },
  });
  const versions: string[] = await res.json();
  cachedVersion = { value: versions[0], fetchedAt: Date.now() };
  return versions[0];
}

export function championSquareUrl(version: string, championName: string) {
  return `${DDRAGON_CDN}/${version}/img/champion/${championName}.png`;
}

export function profileIconUrl(version: string, profileIconId: number) {
  return `${DDRAGON_CDN}/${version}/img/profileicon/${profileIconId}.png`;
}

/** itemId 0 means "empty slot" — Riot doesn't serve an image for it, caller should skip. */
export function itemIconUrl(version: string, itemId: number) {
  return `${DDRAGON_CDN}/${version}/img/item/${itemId}.png`;
}

export function rankEmblemUrl(tier: string) {
  const normalized = tier.toLowerCase();
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblems/emblem-${normalized}.png`;
}
