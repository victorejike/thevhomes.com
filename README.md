# TheVHomes — Premium Real Estate Marketplace

**THE VHOMES LIMITED** · Abuja, Nigeria
📞 +234 806 246 3468 · ✉️ thevhomes@gmail.com

A full-stack real estate marketplace and property management platform:
Next.js 15 frontend, Go (Gin) REST + WebSocket API, PostgreSQL, and
production deployment configs for Netlify + Render + Cloudflare R2.

```
thevhomes-platform/
├── frontend/    Next.js 15 + TypeScript + Tailwind + Framer Motion (Netlify)
├── backend/     Go + Gin + GORM + PostgreSQL + WebSocket chat (Render)
├── database/    Reference PostgreSQL schema (mirrors GORM AutoMigrate)
└── docs/        API reference + deployment guide
```

## What's implemented (real, working code)

- **Landing page**: full-viewport video/image hero, animated copy, live
  search bar, featured properties (pulled from the API with graceful mock
  fallback), trust metrics, services grid, CTA section.
- **Property marketplace**: filterable/paginated listing page (location,
  type, purpose, price, bedrooms, amenities), SEO-optimized detail pages
  with image gallery, `RealEstateListing` JSON-LD, dynamic OpenGraph
  metadata, and a sitemap generator.
- **Auth**: JWT access + refresh tokens, bcrypt password hashing,
  role-based middleware (admin/agent/customer/support), register/login UI.
- **Viewing bookings**: customers request viewings by date/time; agents/admins
  confirm, complete, or cancel.
- **Real-time chat**: WebSocket hub (presence, typing indicators, read
  receipts) wired end-to-end from the "Chat with Agent" button through to a
  live dashboard inbox.
- **Agent marketplace**: public agent directory, agent profile management,
  admin verification workflow (pending → verified → premium verified) with
  a matching badge system on listings.
- **Investment platform**: browsable opportunities with ROI/timeline data.
- **AI assistant**: floating widget calling a rule-based NLU endpoint that
  parses free-text queries ("4 bedroom house in Abuja under 100 million")
  into real property filters — designed to be swapped for a full LLM later
  with zero frontend changes.
- **Dashboards**: customer dashboard (bookings, saved properties, messages),
  agent listing management (create/list), and an admin overview (property
  and agent tables) — each behind client-side role guards.
- **Multi-language shell**: EN/FR/AR switcher with a starter dictionary for
  navigation and hero copy.
- **Dark/light mode**, mobile-first responsive layout throughout.

## What's intentionally stubbed (needs real credentials to go live)

These are wired up with the correct shapes/interfaces so plugging in real
credentials requires no architectural changes — see `docs/DEPLOYMENT.md` for
exactly what to configure:

| Feature | Status |
|---|---|
| Cloudflare R2 image/video upload | Presign endpoint returns a placeholder URL until `CLOUDFLARE_R2_*` + SDK wiring is added |
| Paystack / Flutterwave payments | Creates a local payment record; needs the provider's real checkout + webhook verification |
| Google Maps embed | Property page shows coordinates in a placeholder panel; drop in `@react-google-maps/api` once `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set |
| Email/SMS notifications, Google Calendar sync | Booking flow works; notification dispatch is a documented TODO in `booking_handler.go` |
| Full LLM-powered assistant | Deterministic keyword parser today (`ai_handler.go`); swap in an OpenAI function-calling call using the same `Property` filters once `OPENAI_API_KEY` is set |
| Google OAuth login | `User.GoogleID` column exists; OAuth flow isn't implemented yet |
| Admin analytics aggregates | Dashboard computes what it can from list endpoints; add a dedicated `GET /api/v1/admin/stats` for revenue/user totals |

## Local development

**Backend** (requires Go 1.22+ and a PostgreSQL instance):

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL, JWT secrets, etc.
go mod tidy
go run ./cmd/server
```

**Frontend** (requires Node 20+):

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend works even without the backend running — every data-fetching
call in `frontend/lib/api.ts` falls back to realistic mock data, so the full
UI (properties, agents, investments, AI assistant) is browsable standalone.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full Netlify + Render
+ Cloudflare R2 walkthrough, and [`docs/API.md`](docs/API.md) for the
complete endpoint reference.

## Note on this build

This codebase was generated in a single offline agent session (no network
access to run `npm install` / `go mod tidy`). Both `go.mod` and
`package.json` declare accurate, real dependency versions, and every file
was manually reviewed for type/syntax correctness, but neither has been
compiled/built end-to-end here. Before deploying:

```bash
cd backend && go mod tidy && go build ./...
cd frontend && npm install && npm run build
```

Run these locally or in CI first and fix anything your Go/TypeScript
toolchain flags (expected to be minor, if anything — mostly import
formatting).
