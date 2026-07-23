# TheVHomes Frontend

Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion + Zustand
+ TanStack React Query.

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The app works fully standalone — every API call
in `lib/api.ts` falls back to bundled mock data (`lib/mock-data.ts`) when the
backend is unreachable, so you can develop the UI before the Go API exists.

## Structure

```
app/
  layout.tsx              Root HTML shell, fonts, metadata, JSON-LD
  (marketing)/             Public site (navbar/footer/AI widget layout)
    page.tsx               Homepage
    properties/            Search + detail pages
    agents/, investments/, login/, register/
  dashboard/               Customer/agent app shell (client-guarded)
  admin/                   Admin overview (client-guarded, role=admin)
components/                Shared UI (cards, forms, chat widget, etc.)
lib/
  api.ts                   Fetch client with mock-data fallback
  store.ts                 Zustand stores (auth, filters, saved, locale)
  use-chat-socket.ts       WebSocket hook for real-time chat
  i18n.ts                  Lightweight EN/FR/AR dictionary
```

## Environment Variables

See `.env.example`. Only `NEXT_PUBLIC_API_URL` is required for a real
backend connection; the rest are optional enhancements.

## Notes / Roadmap

- **i18n**: current implementation is a lightweight client-side dictionary
  covering navigation + hero copy. For full production i18n (translated
  property content, server-rendered per-locale routes), migrate to
  `next-intl`.
- **Maps**: the property detail page shows a placeholder panel with
  coordinates. Swap in `@react-google-maps/api` once
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set.
- **Hero video**: plays a real stock property-walkthrough video by default
  (no setup required). Set `NEXT_PUBLIC_HERO_VIDEO_URL` to swap in
  TheVHomes' own branded footage once it's hosted (e.g. on Cloudflare R2). If
  a video URL ever fails to load, it gracefully falls back to a static image.
- **CTA video**: the "Ready to Find Your Perfect Property?" section near the
  footer has its own background video (`NEXT_PUBLIC_CTA_VIDEO_URL`), same
  fallback behavior as the hero.
- **Animated stats**: the trust-metrics strip right after the hero counts up
  from 0 the first time it scrolls into view (`components/count-up.tsx`).
- **Cycling property photos**: each property card automatically cycles
  through all of that listing's images every few seconds (pausing on
  hover), with small dot indicators.

## Deployment

Deploys to Netlify via `netlify.toml` (Next.js runtime plugin). See
`../docs/DEPLOYMENT.md` for the full walkthrough.
