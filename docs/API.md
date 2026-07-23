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
| POST | `/auth/refresh` | Exchange a refresh token for a new pair |
| GET | `/auth/me` | Current user profile (auth required) |

## Properties

| Method | Path | Description |
|---|---|---|
| GET | `/properties` | List/search properties. Query params: `city`, `property_type`, `purpose`, `min_price`, `max_price`, `bedrooms`, `bathrooms`, `furnished`, `parking`, `security`, `swimming_pool`, `q`, `agent_id`, `page`, `page_size` |
| GET | `/properties/:id` | Fetch by UUID or slug |
| GET | `/properties/:id/reviews` | Reviews for a property |
| POST | `/properties` | Create listing (agent/admin) |
| PUT | `/properties/:id` | Update listing (owning agent/admin) |
| DELETE | `/properties/:id` | Delete listing (owning agent/admin) |

## Agents

| Method | Path | Description |
|---|---|---|
| GET | `/agents` | List agents |
| GET | `/agents/:id` | Agent profile + listings |
| PUT | `/agents/me` | Update own agent profile (agent/admin) |
| PATCH | `/agents/:id/verify` | Set verification level (admin) |

## Bookings (Viewing Scheduler)

| Method | Path | Description |
|---|---|---|
| POST | `/bookings` | Request a viewing (auth) |
| GET | `/bookings/me` | Bookings for current user (as customer or agent) |
| PATCH | `/bookings/:id/status` | Confirm/complete/cancel (agent/admin) |

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
| POST | `/payments/initialize` | Create a payment record (auth) — provider checkout integration pending |
| GET | `/payments/:reference/verify` | Check payment status |

## AI Assistant

| Method | Path | Description |
|---|---|---|
| POST | `/ai/ask` | Natural-language property search, e.g. `{"message": "4 bedroom house in Abuja under 100 million"}` |

## Uploads

| Method | Path | Description |
|---|---|---|
| POST | `/uploads/presign` | Get a presigned URL for direct-to-R2 upload — pending real R2 credentials |
