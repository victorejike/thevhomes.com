import type {
  Agent,
  ApiResponse,
  AuthUser,
  Booking,
  ChatMessage,
  Conversation,
  Investment,
  PaginatedProperties,
  Property,
  PropertySearchFilters,
} from "./types";
import { MOCK_AGENTS, MOCK_INVESTMENTS, MOCK_PROPERTIES } from "./mock-data";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

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
  },
  bookings: {
    create: (payload: { property_id: string; scheduled_date: string; notes?: string }) =>
      request<Booking>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
    listMine: () => request<Booking[]>("/bookings/me"),
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
