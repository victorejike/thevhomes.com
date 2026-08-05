import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CookieCategory = "necessary" | "analytics" | "marketing" | "preferences";

export interface CookiePreferences {
  necessary: true; // always on, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

interface CookieConsentState {
  /** Whether the visitor has made an explicit choice (Accept All / Reject
   * Non-Essential / saved custom preferences). Until this is true, the
   * banner stays visible. */
  hasResponded: boolean;
  preferences: CookiePreferences;
  isPreferencesModalOpen: boolean;
  respondedAt: string | null;

  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: Partial<Omit<CookiePreferences, "necessary">>) => void;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  /** Convenience check used anywhere the app wants to gate a feature
   * (analytics logging, personalization/AI, marketing pixels, remembered
   * language/theme) behind consent. */
  hasConsent: (category: CookieCategory) => boolean;
}

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set, get) => ({
      hasResponded: false,
      preferences: DEFAULT_PREFERENCES,
      isPreferencesModalOpen: false,
      respondedAt: null,

      acceptAll: () =>
        set({
          hasResponded: true,
          respondedAt: new Date().toISOString(),
          preferences: { necessary: true, analytics: true, marketing: true, preferences: true },
          isPreferencesModalOpen: false,
        }),

      rejectNonEssential: () =>
        set({
          hasResponded: true,
          respondedAt: new Date().toISOString(),
          preferences: { necessary: true, analytics: false, marketing: false, preferences: false },
          isPreferencesModalOpen: false,
        }),

      savePreferences: (prefs) =>
        set((state) => ({
          hasResponded: true,
          respondedAt: new Date().toISOString(),
          preferences: { ...state.preferences, ...prefs, necessary: true },
          isPreferencesModalOpen: false,
        })),

      openPreferencesModal: () => set({ isPreferencesModalOpen: true }),
      closePreferencesModal: () => set({ isPreferencesModalOpen: false }),

      hasConsent: (category) => {
        if (category === "necessary") return true;
        return get().preferences[category];
      },
    }),
    { name: "thevhomes-cookie-consent" }
  )
);
