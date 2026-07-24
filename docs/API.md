# TheVHomes API Reference

Base URL: `https://<your-render-service>.onrender.com/api/v1`

All responses share the envelope:

```json
{ "success": true, "message": "...", "data": { } }
```

Authenticated routes expect `Authorization: Bearer <access_token>`.

## Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create a customer or agent account |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/refresh` | Exchange a valid, non-revoked refresh token for a new pair (rotates the old one) |
| POST | `/auth/logout` | Revoke a refresh token |
| GET | `/auth/me` | Current user profile (auth required) |
| GET | `/auth/google` | Get the Google OAuth consent URL |
| GET | `/auth/google/callback` | Google redirects here with `?code=`; we redirect on to the frontend with a short-lived exchange code |
| POST | `/auth/google/exchange` | Trade the exchange code for a real access/refresh token pair |

## Identity Verification (VerifyMe)

| Method | Path | Description |
|---|---|---|
| POST | `/verification/identity` | Submit full name, NIN, DOB, phone for VerifyMe verification (auth) |
| GET | `/verification/identity/me` | Current user's verification status (auth) |

## Properties

| Method | Path | Description |
|---|---|---|
| GET | `/properties` | List/search properties (public; shows only `verified` listings unless you're the owning agent/admin). Query params: `city`, `property_type`, `purpose`, `min_price`, `max_price`, `bedrooms`, `bathrooms`, `furnished`, `parking`, `security`, `swimming_pool`, `q`, `agent_id`, `page`, `page_size` |
| GET | `/properties/:id` | Fetch by UUID or slug |
| GET | `/properties/:id/reviews` | Reviews for a property |
| GET | `/properties/:id/tour` | Fetch the property's 3D tour + scenes |
| POST | `/properties` | Create a draft listing (approved agent/admin only) |
| PUT | `/properties/:id` | Update listing (owning agent/admin) |
| DELETE | `/properties/:id` | Delete listing (owning agent/admin) |
| POST | `/properties/:id/submit-for-review` | Submit a draft for admin review (requires cover photo, images, amenities, coordinates, and a `ready` 3D tour) |
| POST | `/properties/:id/tour/start` | Choose a capture method and start the 3D tour |
| POST | `/properties/:id/tour/scenes` | Add a captured room scene (photo/video) |
| POST | `/properties/:id/tour/complete` | Finish capture; hands off to a reconstruction provider or marks ready |
| POST | `/tours/:id/webhook` | 3D-reconstruction provider async completion callback |

## Agents

| Method | Path | Description |
|---|---|---|
| GET | `/agents` | List agents |
| GET | `/agents/:id` | Agent profile + listings |
| PUT | `/agents/me` | Update own agent profile (agent/admin) |
| PATCH | `/agents/:id/verify` | Set legacy verification badge level (admin) |
| POST | `/agents/applications` | Submit business onboarding application (requires personal identity verification first) |
| GET | `/agents/applications/me` | Current agent's application status + history |

## Bookings (Professional Property Viewing)

| Method | Path | Description |
|---|---|---|
| POST | `/bookings` | Request a viewing: `viewing_type` = `physical`\|`virtual`\|`video` (auth) |
| GET | `/bookings/me` | Bookings for current user (as customer or agent) |
| GET | `/bookings/:id` | Fetch a single booking (participants/admin only) |
| PATCH | `/bookings/:id/status` | Confirm/complete/cancel (agent/admin) |
| GET | `/bookings/:id/ticket` | Fetch the QR viewing ticket |
| PATCH | `/bookings/:id/ticket/check-in` | Agent/admin checks a customer in on arrival |
| GET | `/bookings/:id/live-session` | Fetch the live/video session for this booking |
| PATCH | `/live-sessions/:token/start` | Mark a live video session as started |
| PATCH | `/live-sessions/:token/end` | End a live video session (booking marked completed) |

## Chat

| Method | Path | Description |
|---|---|---|
| POST | `/conversations` | Get-or-create a conversation with another user |
| GET | `/conversations` | List my conversations |
| GET | `/conversations/:id/messages` | Message history |
| GET | `/ws/chat?token=<access_token>` | WebSocket upgrade for real-time chat |

WebSocket message frames (JSON):

```json
{ "type": "message", "conversation_id": "...", "recipient_id": "...", "content": "..." }
{ "type": "typing", "conversation_id": "...", "recipient_id": "..." }
{ "type": "read_receipt", "conversation_id": "..." }
```

## Reviews

| Method | Path | Description |
|---|---|---|
| POST | `/reviews` | Submit a property/agent review (auth) |

## Investments

| Method | Path | Description |
|---|---|---|
| GET | `/investments` | List open opportunities |
| GET | `/investments/:id` | Opportunity detail |
| POST | `/investments` | Create opportunity (admin) |

## Payments

| Method | Path | Description |
|---|---|---|
| POST | `/payments/initialize` | Initialize a Paystack/Flutterwave checkout (`purpose`: `booking_fee`\|`reservation`\|`consultation`\|`shortlet_booking`\|`viewing_fee`) |
| GET | `/payments/:reference/verify` | Verify against the provider's API; on success for `viewing_fee`, issues the booking's ticket and notifies customer/agent/admin |
| POST | `/payments/webhook/:provider` | Provider server-to-server callback (re-verified against the provider before trusting it) |
| POST | `/payments/:reference/refund-request` | Customer requests a refund (auth) |

## Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/notifications/me` | In-app notification inbox + unread count (auth) |
| PATCH | `/notifications/:id/read` | Mark one notification read |
| PATCH | `/notifications/read-all` | Mark all notifications read |

## Admin Dashboard (admin role required)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Overview counters + revenue-by-purpose |
| GET | `/admin/bookings` | Viewing management (`status`, `paid_only`, `upcoming` filters) |
| GET | `/admin/payments` | Transaction history (`status`, `purpose`, `refund_status` filters) |
| PATCH | `/admin/payments/:reference/refund` | Approve/reject/mark a refund complete |
| GET | `/admin/audit-logs` | Immutable log of every sensitive admin action |
| GET | `/admin/verifications` | Identity verification queue (`status` filter) |
| PATCH | `/admin/verifications/:id` | Manually approve/reject a verification |
| GET | `/admin/agent-applications` | Agent onboarding queue (`status` filter) |
| PATCH | `/admin/agent-applications/:id` | Approve (assigns a permanent agent number) / reject / mark under review |
| GET | `/admin/properties/review-queue` | Property verification queue (`status` filter) |
| PATCH | `/admin/properties/:id/review` | Move a listing through Under Inspection → Verified/Rejected with a QA checklist |

## AI Assistant

| Method | Path | Description |
|---|---|---|
| POST | `/ai/ask` | Natural-language property search, e.g. `{"message": "4 bedroom house in Abuja under 100 million"}` |

## Uploads

| Method | Path | Description |
|---|---|---|
| POST | `/uploads/presign` | Get a presigned URL for direct-to-R2 upload — pending real R2 credentials |
