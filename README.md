# Rift Report

Search a League of Legends Riot ID, see the last 10 games with champion art, and get an
opinionated comment about them ("you should play more X" / "yeah... never play X again").

v1.0.0 scope: League of Legends only.

## Stack

- Next.js App Router (TypeScript), Route Handlers as the Riot API proxy/BFF
- Postgres via [Neon](https://neon.tech), Prisma 7 (driver adapter: `@prisma/adapter-neon`)
- TanStack Query (client data fetching/loading state), Framer Motion (animations), Tailwind CSS
- Data Dragon CDN for champion/profile-icon images (no key required, called straight from the client)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `RIOT_API_KEY` — from the [Riot Developer Portal](https://developer.riotgames.com/). A
     dev key expires every 24h; apply for a **Personal API key** once you're past prototyping.
   - `DATABASE_URL` — a Neon Postgres connection string (use the **pooled** connection string
     from your Neon project dashboard).
3. Push the schema to your database: `npx prisma db push`
4. `npm run dev` and open the printed local URL.

Dev/build scripts run webpack (`--webpack`) instead of Turbopack — on Windows, Turbopack's
node_modules junction-point caching can fail without Developer Mode / elevated permissions.
Vercel's Linux build environment isn't affected; drop the flag there if you want Turbopack.

## Data model / caching

Riot match data is immutable once a game ends, so `MatchRecord` rows are a permanent cache —
a given match is only ever fetched from Riot once, no matter how many times it's viewed.
`Account` rows (profile + rank) refresh every 10 minutes. See
[`prisma/schema.prisma`](prisma/schema.prisma) and
[`src/lib/riot/service.ts`](src/lib/riot/service.ts).

## Compliance

Per Riot's Developer Policies, the app displays the required "not endorsed by Riot Games"
notice in the footer ([`src/components/footer.tsx`](src/components/footer.tsx)). A dev/personal
key is for prototyping and small private use only — don't run this for public traffic without
applying for a Production key.

## Deploy

Designed for Vercel: connect the repo, set `RIOT_API_KEY` and `DATABASE_URL` as environment
variables, deploy. No Docker needed — Neon is already a managed/serverless Postgres and Vercel
builds Next.js natively.
