import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, Property, PropertySearchFilters } from "./types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("thevhomes_access_token", accessToken);
          localStorage.setItem("thevhomes_refresh_token", refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("thevhomes_access_token");
          localStorage.removeItem("thevhomes_refresh_token");
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: "thevhomes-auth" }
  )
);

interface FilterState {
  filters: PropertySearchFilters;
  setFilters: (filters: PropertySearchFilters) => void;
  resetFilters: () => void;
}

export const usePropertyFilterStore = create<FilterState>((set) => ({
  filters: {},
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: {} }),
}));

interface SavedPropertiesState {
  savedIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedPropertiesStore = create<SavedPropertiesState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSaved: (id) =>
        set((state) => ({
          savedIds: state.savedIds.includes(id)
            ? state.savedIds.filter((existing) => existing !== id)
            : [...state.savedIds, id],
        })),
      isSaved: (id) => get().savedIds.includes(id),
    }),
    { name: "thevhomes-saved-properties" }
  )
);

export type Locale = "en" | "fr" | "ar";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "thevhomes-locale" }
  )
);

export function propertyToCacheKey(filters: PropertySearchFilters) {
  return JSON.stringify(filters);
}

export type { Property };
