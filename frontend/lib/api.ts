import type {
  Agent,
  AgentApplication,
  ApiResponse,
  AppNotification,
  AuthUser,
  Booking,
  ChatMessage,
  Conversation,
  IdentityVerification,
  Investment,
  LiveViewingSession,
  PaginatedProperties,
  Payment,
  Property,
  PropertySearchFilters,
  PropertyTour,
  ViewingTicket,
} from "./types";
import { MOCK_AGENTS, MOCK_INVESTMENTS, MOCK_PROPERTIES } from "./mock-data";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://thevhomes-com.onrender.com/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("thevhomes_access_token") : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, res.status);
  }

  return json.data;
}

function buildQuery(filters: PropertySearchFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Every read function below falls back to bundled mock data when the API is
 * unreachable (network error / backend not deployed yet), so the frontend
 * always renders a complete experience — including during local development
 * before `thevhomes-api` is running.
 */
export const api = {
  properties: {
    async list(filters: PropertySearchFilters = {}): Promise<PaginatedProperties> {
      try {
        return await request<PaginatedProperties>(`/properties${buildQuery(filters)}`);
      } catch {
        return paginateMock(MOCK_PROPERTIES, filters);
      }
    },
    async get(idOrSlug: string): Promise<Property> {
      try {
        return await request<Property>(`/properties/${idOrSlug}`);
      } catch {
        const found = MOCK_PROPERTIES.find(
          (p) => p.id === idOrSlug || p.slug === idOrSlug
        );
        if (!found) throw new ApiError("Property not found", 404);
        return found;
      }
    },
    create: (payload: Record<string, unknown>) =>
      request<Property>("/properties", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: Record<string, unknown>) =>
      request<Property>(`/properties/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: string) => request<null>(`/properties/${id}`, { method: "DELETE" }),
    submitForReview: (id: string) =>
      request<{ listing_status: string }>(`/properties/${id}/submit-for-review`, { method: "POST" }),
  },
  investments: {
    async list(): Promise<Investment[]> {
      try {
        return await request<Investment[]>("/investments");
      } catch {
        return MOCK_INVESTMENTS;
      }
    },
  },
  agents: {
    async list(): Promise<Agent[]> {
      try {
        return await request<Agent[]>("/agents");
      } catch {
        return MOCK_AGENTS;
      }
    },
    async get(id: string): Promise<Agent> {
      try {
        return await request<Agent>(`/agents/${id}`);
      } catch {
        const found = MOCK_AGENTS.find((a) => a.id === id);
        if (!found) throw new ApiError("Agent not found", 404);
        return found;
      }
    },
  },
  auth: {
    register: (payload: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role?: "customer" | "agent";
    }) =>
      request<{ user: AuthUser; access_token: string; refresh_token: string }>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(payload) }
      ),
    login: (payload: { email: string; password: string }) =>
      request<{ user: AuthUser; access_token: string; refresh_token: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(payload) }
      ),
    me: () => request<AuthUser>("/auth/me"),
    logout: (refreshToken: string) =>
      request<null>("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }),
    googleAuthUrl: () => request<{ auth_url: string; state: string }>("/auth/google"),
    exchangeGoogleCode: (code: string) =>
      request<{ user: AuthUser; access_token: string; refresh_token: string }>("/auth/google/exchange", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
  },
  verification: {
    submit: (payload: {
      full_name: string;
      nin: string;
      date_of_birth: string;
      phone_number: string;
      selfie_url?: string;
    }) => request<{ status: string; badge: string }>("/verification/identity", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    status: () => request<IdentityVerification | { status: "not_submitted" }>("/verification/identity/me"),
  },
  agentApplications: {
    submit: (payload: {
      business_name: string;
      office_address: string;
      cac_number?: string;
      cac_document_url?: string;
      government_id_url: string;
      profile_photo_url: string;
      selfie_url?: string;
    }) => request<AgentApplication>("/agents/applications", { method: "POST", body: JSON.stringify(payload) }),
    mine: () => request<{ agent: Agent; applications: AgentApplication[] }>("/agents/applications/me"),
  },
  tours: {
    get: (propertyId: string) => request<PropertyTour>(`/properties/${propertyId}/tour`),
    start: (propertyId: string, captureMethod: string) =>
      request<PropertyTour>(`/properties/${propertyId}/tour/start`, {
        method: "POST",
        body: JSON.stringify({ capture_method: captureMethod }),
      }),
    addScene: (
      propertyId: string,
      payload: { room_name: string; media_url: string; scene_type: string }
    ) =>
      request(`/properties/${propertyId}/tour/scenes`, { method: "POST", body: JSON.stringify(payload) }),
    complete: (
      propertyId: string,
      payload?: { asset_url?: string; thumbnail_url?: string; processing_provider?: string; processing_job_id?: string }
    ) =>
      request<PropertyTour>(`/properties/${propertyId}/tour/complete`, {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
      }),
  },
  payments: {
    initialize: (payload: {
      amount: number;
      currency?: string;
      purpose: "booking_fee" | "reservation" | "consultation" | "shortlet_booking" | "viewing_fee";
      provider: "paystack" | "flutterwave";
      property_id?: string;
      booking_id?: string;
    }) =>
      request<{ payment: Payment; checkout_url?: string } | Payment>("/payments/initialize", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    verify: (reference: string) =>
      request<{ payment: Payment; receipt: Record<string, unknown> }>(`/payments/${reference}/verify`),
    requestRefund: (reference: string, reason: string) =>
      request<Payment>(`/payments/${reference}/refund-request`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },
  notifications: {
    listMine: () => request<{ items: AppNotification[]; unread_count: number }>("/notifications/me"),
    markRead: (id: string) => request<null>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => request<null>("/notifications/read-all", { method: "PATCH" }),
  },
  admin: {
    stats: () => request<Record<string, unknown>>("/admin/stats"),
    bookings: (params: Record<string, string> = {}) =>
      request<Booking[]>(`/admin/bookings${buildQuery(params)}`),
    payments: (params: Record<string, string> = {}) =>
      request<Payment[]>(`/admin/payments${buildQuery(params)}`),
    resolveRefund: (reference: string, decision: "approved" | "rejected" | "refunded", notes?: string) =>
      request<Payment>(`/admin/payments/${reference}/refund`, {
        method: "PATCH",
        body: JSON.stringify({ decision, notes }),
      }),
    auditLogs: () => request<Record<string, unknown>[]>("/admin/audit-logs"),
    verifications: (status?: string) =>
      request<IdentityVerification[]>(`/admin/verifications${status ? `?status=${status}` : ""}`),
    reviewVerification: (id: string, status: "verified" | "rejected", notes?: string) =>
      request<IdentityVerification>(`/admin/verifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      }),
    agentApplications: (status?: string) =>
      request<AgentApplication[]>(`/admin/agent-applications${status ? `?status=${status}` : ""}`),
    reviewAgentApplication: (
      id: string,
      decision: "approve" | "reject" | "under_review",
      notes?: string
    ) =>
      request<AgentApplication>(`/admin/agent-applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision, notes }),
      }),
    propertyReviewQueue: (status?: string) =>
      request<Property[]>(`/admin/properties/review-queue${status ? `?status=${status}` : ""}`),
    reviewProperty: (
      id: string,
      payload: {
        status: "under_inspection" | "verified" | "rejected";
        images_checked?: boolean;
        ownership_doc_checked?: boolean;
        location_checked?: boolean;
        details_checked?: boolean;
        tour_checked?: boolean;
        notes?: string;
        premium_listing?: boolean;
      }
    ) =>
      request<Property>(`/admin/properties/${id}/review`, { method: "PATCH", body: JSON.stringify(payload) }),
  },
  bookings: {
    create: (payload: {
      property_id: string;
      scheduled_date: string;
      notes?: string;
      viewing_type?: "physical" | "virtual" | "video";
    }) => request<Booking>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
    listMine: () => request<Booking[]>("/bookings/me"),
    get: (id: string) => request<Booking>(`/bookings/${id}`),
    updateStatus: (id: string, status: "pending" | "confirmed" | "completed" | "cancelled") =>
      request<Booking>(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    getTicket: (bookingId: string) => request<ViewingTicket>(`/bookings/${bookingId}/ticket`),
    checkInTicket: (bookingId: string) =>
      request<ViewingTicket>(`/bookings/${bookingId}/ticket/check-in`, { method: "PATCH" }),
    getLiveSession: (bookingId: string) => request<LiveViewingSession>(`/bookings/${bookingId}/live-session`),
  },
  liveSessions: {
    start: (token: string) =>
      request<LiveViewingSession>(`/live-sessions/${token}/start`, { method: "PATCH" }),
    end: (token: string, recordingUrl?: string) =>
      request<LiveViewingSession>(`/live-sessions/${token}/end`, {
        method: "PATCH",
        body: JSON.stringify({ recording_url: recordingUrl }),
      }),
  },
  conversations: {
    list: () => request<Conversation[]>("/conversations"),
    start: (participantId: string, propertyId?: string) =>
      request<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify({ participant_id: participantId, property_id: propertyId }),
      }),
    history: (conversationId: string) =>
      request<ChatMessage[]>(`/conversations/${conversationId}/messages`),
  },
  uploads: {
    presign: (filename: string, contentType: string) =>
      request<{ upload_url: string; public_url: string; expires_in: number }>("/uploads/presign", {
        method: "POST",
        body: JSON.stringify({ filename, content_type: contentType }),
      }),
  },
  ai: {
    async ask(message: string) {
      try {
        return await request<{
          reply: string;
          matches: Property[];
          llm_enabled: boolean;
        }>("/ai/ask", { method: "POST", body: JSON.stringify({ message }) });
      } catch {
        // Deterministic local fallback so the assistant widget always responds,
        // even if the API is offline — mirrors the backend's own rule-based parser.
        const lower = message.toLowerCase();
        const matches = MOCK_PROPERTIES.filter((p) => {
          const cityMatch = !p.city || lower.includes(p.city.toLowerCase());
          return cityMatch;
        }).slice(0, 5);
        return {
          reply: `Here's what I found (offline demo mode): ${matches.length} matching properties.`,
          matches,
          llm_enabled: false,
        };
      }
    },
  },
};

function paginateMock(
  items: Property[],
  filters: PropertySearchFilters
): PaginatedProperties {
  let filtered = items;
  if (filters.city) {
    filtered = filtered.filter(
      (p) => p.city.toLowerCase() === String(filters.city).toLowerCase()
    );
  }
  if (filters.property_type) {
    filtered = filtered.filter((p) => p.property_type === filters.property_type);
  }
  if (filters.purpose) {
    filtered = filtered.filter((p) => p.purpose === filters.purpose);
  }
  if (filters.min_price) {
    filtered = filtered.filter((p) => p.price >= Number(filters.min_price));
  }
  if (filters.max_price) {
    filtered = filtered.filter((p) => p.price <= Number(filters.max_price));
  }
  if (filters.bedrooms) {
    filtered = filtered.filter((p) => p.bedrooms >= Number(filters.bedrooms));
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }

  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 12;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    items: paged,
    page,
    page_size: pageSize,
    total: filtered.length,
    total_pages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export { ApiError };
