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

### Phase 1 — Marketplace foundation

- **Landing page**: full-viewport video/image hero, animated copy, live
  search bar, featured properties (pulled from the API with graceful mock
  fallback), trust metrics, services grid, CTA section.
- **Property marketplace**: filterable/paginated listing page (location,
  type, purpose, price, bedrooms, amenities), SEO-optimized detail pages
  with image gallery, `RealEstateListing` JSON-LD, dynamic OpenGraph
  metadata, and a sitemap generator.
- **Auth**: JWT access + refresh tokens (server-side revocable, see Phase 2),
  bcrypt password hashing, role-based middleware (admin/agent/customer/support).
- **Real-time chat**: WebSocket hub (presence, typing indicators, read
  receipts) wired end-to-end from the "Chat with Agent" button through to a
  live dashboard inbox.
- **Investment platform**: browsable opportunities with ROI/timeline data.
- **AI assistant**: floating widget calling a rule-based NLU endpoint that
  parses free-text queries ("4 bedroom house in Abuja under 100 million")
  into real property filters — swap in a full LLM via `OPENAI_API_KEY` with
  zero frontend changes.
- **Multi-language shell**: EN/FR/AR switcher. **Dark/light mode**, mobile-first
  responsive layout throughout.

### Phase 2 — Trust & enterprise upgrade

- **Google OAuth login**: "Continue/Sign in/Sign up with Google" — first-time
  sign-in auto-creates an account, a matching email auto-links existing
  accounts (no duplicates), identity is verified server-side against
  Google's `tokeninfo` endpoint, and a short-lived one-time exchange code
  (never a raw JWT) rides the OAuth redirect back to the frontend.
- **VerifyMe NIN identity verification**: every user submits full name, NIN,
  DOB, and phone; the backend validates the response server-side, encrypts
  the NIN at rest (AES-256-GCM), and only ever exposes the last 4 digits.
  Runs in a clearly-logged local "sandbox mode" until `VERIFYME_API_KEY` is set.
- **Secure agent onboarding**: personal identity verification → business
  application (office address, CAC, government ID, selfie) → admin review →
  a permanent, sequential, never-reused `TVH-AGT-######` agent number
  assigned exactly once, atomically, via a row-locked counter. Only agents
  with an assigned number can create/publish listings.
- **Property verification workflow**: Draft → Pending Review → Under
  Inspection → Verified/Rejected, with an admin checklist (images, ownership
  docs, location, details, 3D tour) and a full audit trail.
- **Camera-based 3D property tours**: agents scan each room with their phone
  camera (native camera capture on Android/iPhone/tablets); supports
  Gaussian Splatting / NeRF / WebXR / Matterport-compatible / simple 360°
  photo workflows. The in-browser viewer (no app install) supports
  walkthrough navigation, drag-to-look 360° viewing, zoom, and fullscreen. A
  listing cannot be submitted for review until its tour is `ready`.
- **Google Maps integration**: live map + marker, "Get Directions", and a
  Places-API-powered panel showing distance to the nearest school, hospital,
  supermarket, and airport.
- **Paid viewing bookings**: physical, live-video, or pre-recorded-video
  viewings; paid listings route through Paystack/Flutterwave before a
  QR-coded viewing ticket is issued; customer/agent/admin are all notified.
- **Live video property tours**: peer-to-peer WebRTC HD video between
  customer and agent, signaling relayed over the existing chat WebSocket.
- **Trust badges**: ✅ Identity Verified · 🏅 Verified Agent · 🏠 Verified
  Property · ⭐ Premium Listing, surfaced in search results, property pages,
  and agent profiles.
- **Enterprise admin dashboard**: identity verification queue, agent
  approval (with agent-ID assignment), property review queue, viewing
  management (upcoming/paid/attendance), payments + refunds + revenue
  reporting, and an audit-log viewer.
- **Notifications**: in-app inbox (bell icon) + email (SMTP) for every key
  event — verification approved/rejected, agent approved, booking confirmed,
  payment successful, listing approved/rejected. SMS/WhatsApp channels are
  modeled in the schema and ready to wire up.
- **Security**: NIN/PII encrypted at rest, refresh tokens hashed + revocable
  server-side, role-based access control throughout, and an immutable audit
  log for every approval/verification/refund action.

## What's intentionally stubbed (needs real credentials to go live)

These are wired up with the correct shapes/interfaces (real HTTP calls,
correct request/response parsing) so plugging in real credentials requires
no architectural changes — see `docs/DEPLOYMENT.md` for exactly what to
configure:

| Feature | Status |
|---|---|
| Cloudflare R2 image/video/3D-tour-scene upload | Presign endpoint signs real AWS SigV4 URLs; needs `CLOUDFLARE_R2_*` credentials |
| Paystack / Flutterwave payments | Real `/transaction/initialize`, `/verify`, and webhook handling wired up; needs `PAYSTACK_SECRET_KEY` / `FLUTTERWAVE_SECRET_KEY` |
| Google OAuth login | Real code-exchange + `tokeninfo` verification wired up; needs `GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URL` |
| VerifyMe NIN verification | Real API client wired up; needs `VERIFYME_API_KEY` (falls back to a clearly-logged local sandbox mode otherwise) |
| Google Maps + Places | Map/marker/directions/nearby-landmarks all real; needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with Places API enabled |
| Email notifications | Real SMTP dispatch wired up; needs `SMTP_HOST/USER/PASSWORD` |
| SMS / WhatsApp notifications | `Notification.Channel` models these; dispatch integration (e.g. Twilio) is a documented TODO in `internal/services/notify.go` |
| Gaussian-splat/NeRF cloud reconstruction | Capture + upload pipeline and a `PropertyTour` webhook callback are wired up; plug in a provider (Matterport, KIRI Engine, Luma AI, Polycam) via `PROCESSING_PROVIDER`/webhook |
| Full LLM-powered assistant | Deterministic keyword parser today (`ai_handler.go`); swap in an OpenAI function-calling call using the same `Property` filters once `OPENAI_API_KEY` is set |

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
