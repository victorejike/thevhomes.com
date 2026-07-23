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
4. Implement the real presigned-URL logic in
   `backend/internal/handlers/upload_handler.go` (currently a documented
   stub) using `aws-sdk-go-v2`'s S3 presign client, which is R2-compatible.
5. (Optional) Point a custom domain like `media.thevhomes.com` at the bucket
   for clean public image URLs.

## 5. Payments (Paystack / Flutterwave)

1. Obtain live/test secret keys from the Paystack and/or Flutterwave
   dashboards.
2. Set `PAYSTACK_SECRET_KEY` / `FLUTTERWAVE_SECRET_KEY` on the backend.
3. Implement the real "initialize transaction" and "verify transaction" API
   calls in `backend/internal/handlers/payment_handler.go` (currently
   documented stubs that create a local `Payment` record with a reference,
   ready for the provider integration to slot into).
4. Configure each provider's webhook URL to point at a new
   `POST /api/v1/payments/webhook/:provider` endpoint (add this handler once
   you're ready — verify the request signature before trusting it).

## 6. Third-Party Keys Checklist

| Service | Env Var | Used For |
|---|---|---|
| Google Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Interactive property location maps |
| OpenAI (optional) | `OPENAI_API_KEY` | Upgrading the AI assistant from rule-based parsing to full LLM chat |
| Paystack | `PAYSTACK_SECRET_KEY` | Nigerian card/bank payments |
| Flutterwave | `FLUTTERWAVE_SECRET_KEY` | Pan-African payments |
| Cloudflare R2 | `CLOUDFLARE_R2_*` | Property image/video storage |
| SMTP | `SMTP_*` | Booking confirmations, password resets |

## 7. Post-Deploy Smoke Test

1. `GET /health` on the API returns 200.
2. Register a customer + agent account via the frontend `/register` page.
3. As the agent, create a listing via `/dashboard/properties/new`.
4. As the customer, browse `/properties`, open the listing, and submit a
   viewing request.
5. Open `/dashboard/messages` in two browser sessions (customer + agent) to
   confirm the WebSocket chat delivers messages in real time.
