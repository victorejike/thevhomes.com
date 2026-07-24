# Deployment Guide

This covers deploying TheVHomes to production: **Netlify** (frontend),
**Render** (API + PostgreSQL), and **Cloudflare R2** (media storage).

## 1. Database (Render PostgreSQL)

1. In the Render dashboard, create a new **PostgreSQL** instance (or let
   `backend/render.yaml` provision `thevhomes-db` automatically via Blueprint
   deploy).
2. Note the internal connection string — it will be injected into the API
   service as `DATABASE_URL`.
3. The Go API runs `gorm.AutoMigrate` on startup, so tables are created
   automatically on first boot. `database/schema.sql` documents the same
   schema for teams that prefer explicit migrations instead.

## 2. Backend API (Render)

1. Push this repository to GitHub/GitLab.
2. In Render, choose **New > Blueprint** and point it at `backend/render.yaml`,
   or manually create a **Web Service**:
   - Environment: **Docker** (uses `backend/Dockerfile`)
   - Health check path: `/health`
3. Set environment variables (see `backend/.env.example`):
   - `DATABASE_URL` (auto-filled if using the Blueprint + attached DB)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — generate long random strings
   - `FRONTEND_URL` — your Netlify domain, e.g. `https://thevhomes.com`
   - `CLOUDFLARE_R2_*`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`,
     `SMTP_*`, `GOOGLE_MAPS_API_KEY`, `OPENAI_API_KEY` as they become available
   - `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URL`
     for "Continue/Sign in/Sign up with Google"
   - `VERIFYME_API_KEY` for NIN identity verification (omit for local sandbox mode)
   - `ENCRYPTION_KEY` (32+ random bytes, e.g. `openssl rand -base64 32`) to encrypt
     NIN and other sensitive PII at rest — required before handling real user data
   - `REDIS_URL` — optional; enables response caching (see
     `backend/internal/cache`) and should also back the WebSocket hub if you
     scale to multiple API instances
4. Deploy. Confirm `GET https://<your-service>.onrender.com/health` returns
   `{"status":"ok"}`.

## 3. Frontend (Netlify)

1. In Netlify, **Add new site > Import an existing project**, point it at
   this repo with **Base directory: `frontend`**.
2. Build settings (already encoded in `frontend/netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Plugin: `@netlify/plugin-nextjs`
3. Environment variables (Site configuration > Environment variables):
   - `NEXT_PUBLIC_API_URL` = `https://<your-render-service>.onrender.com/api/v1`
   - `NEXT_PUBLIC_HERO_VIDEO_URL` (optional) — a hosted mp4 for the homepage
     hero background
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional, for live map embeds)
4. Point your domain (`thevhomes.com`) at Netlify (Domain management > Add a
   domain), and enable the automatic Let's Encrypt SSL certificate.

## 4. Media Storage (Cloudflare R2)

1. Create an R2 bucket (e.g. `thevhomes-media`) in the Cloudflare dashboard.
2. Create an API token with R2 read/write scope; note the Access Key ID,
   Secret Access Key, and the S3-compatible endpoint URL.
3. Set `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_ACCESS_KEY`,
   `CLOUDFLARE_R2_SECRET_KEY`, `CLOUDFLARE_R2_ENDPOINT` on the backend.
4. The presigned-URL logic in `backend/internal/handlers/upload_handler.go`
   already signs real AWS SigV4 PUT URLs (no SDK dependency needed) — it just
   needs the four `CLOUDFLARE_R2_*` variables set to start working.
5. (Optional) Point a custom domain like `media.thevhomes.com` at the bucket
   for clean public image URLs.

## 5. Payments (Paystack / Flutterwave)

1. Obtain live/test secret keys from the Paystack and/or Flutterwave
   dashboards.
2. Set `PAYSTACK_SECRET_KEY` / `FLUTTERWAVE_SECRET_KEY` on the backend —
   `internal/services/payments.go` already calls each provider's real
   "initialize transaction" and "verify transaction" APIs.
3. Configure each provider's webhook URL to point at
   `POST /api/v1/payments/webhook/:provider` (already implemented; it
   re-verifies the transaction against the provider's API before trusting it).

## 5b. Google OAuth

1. Create an OAuth 2.0 Client ID (Web application) in the Google Cloud Console.
2. Add an authorized redirect URI: `https://<your-render-service>.onrender.com/api/v1/auth/google/callback`.
3. Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and
   `GOOGLE_OAUTH_REDIRECT_URL` (matching the URI above) on the backend.
4. The frontend needs no Google-specific env vars — it just calls
   `GET /api/v1/auth/google` and follows the returned redirect.

## 5c. VerifyMe (NIN Identity Verification)

1. Create a VerifyMe (https://verifyme.ng) account and obtain an API key.
2. Set `VERIFYME_API_KEY` on the backend (and `VERIFYME_BASE_URL` if you're
   using a different environment than the default).
3. Without `VERIFYME_API_KEY` set, the backend runs in a loudly-logged local
   sandbox mode (any well-formed 11-digit NIN auto-verifies) — useful for
   demos, but must never be relied on in production.
4. Set `ENCRYPTION_KEY` so submitted NIN values are encrypted at rest.

## 6. Third-Party Keys Checklist

| Service | Env Var | Used For |
|---|---|---|
| Google Maps + Places | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Interactive property location maps, directions, nearby landmarks |
| Google OAuth | `GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URL` | "Continue/Sign in/Sign up with Google" |
| VerifyMe | `VERIFYME_API_KEY` | NIN identity verification for every user |
| Encryption key | `ENCRYPTION_KEY` | Encrypts NIN and other sensitive PII at rest |
| OpenAI (optional) | `OPENAI_API_KEY` | Upgrading the AI assistant from rule-based parsing to full LLM chat |
| Paystack | `PAYSTACK_SECRET_KEY` | Nigerian card/bank payments (booking fees + paid viewings) |
| Flutterwave | `FLUTTERWAVE_SECRET_KEY` | Pan-African payments |
| Cloudflare R2 | `CLOUDFLARE_R2_*` | Property image/video/3D-tour-scene storage |
| SMTP | `SMTP_*` | Verification/booking/payment/listing email notifications |

## 7. Post-Deploy Smoke Test

1. `GET /health` on the API returns 200.
2. Register a customer + agent account via the frontend `/register` page (or
   "Continue with Google").
3. As either user, complete identity verification at `/dashboard/verify`
   (NIN via VerifyMe — sandbox-approves any well-formed NIN if
   `VERIFYME_API_KEY` isn't set yet).
4. As the agent, submit a business application at
   `/dashboard/agent-application`, then approve it from `/admin/agents` —
   confirm a permanent `TVH-AGT-######` ID is assigned.
5. As the agent, create a listing via `/dashboard/properties/new`, capture a
   3D tour room-by-room, and submit it for review.
6. As an admin, verify the listing at `/admin/properties` — confirm it now
   appears on the public `/properties` page with a Verified Property badge.
7. As the customer, browse `/properties`, open the listing, and book a
   viewing (test both free and paid-viewing flows).
8. Open `/dashboard/messages` in two browser sessions (customer + agent) to
   confirm the WebSocket chat delivers messages in real time, and test a
   live video tour from `/dashboard/bookings`.
