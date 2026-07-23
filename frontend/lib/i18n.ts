import type { Locale } from "./store";

/**
 * Lightweight client-side dictionary covering the primary navigation and
 * hero copy in English, French, and Arabic. For a full production rollout,
 * replace this with `next-intl` (App Router middleware + per-locale routes)
 * so every string — including CMS-driven property descriptions — is
 * translated and server-rendered per locale.
 */
export const dictionary = {
  en: {
    nav_buy: "Buy",
    nav_rent: "Rent",
    nav_shortlet: "Shortlets",
    nav_invest: "Invest",
    nav_agents: "Agents",
    nav_about: "About",
    cta_explore: "Explore Properties",
    cta_book: "Book a Viewing",
    hero_kicker: "THE VHOMES",
    hero_title_1: "Find Your",
    hero_title_2: "Dream Property",
    hero_subtitle: "Luxury Homes. Smart Investments. Better Living.",
    search_placeholder: "Search by location, property name...",
  },
  fr: {
    nav_buy: "Acheter",
    nav_rent: "Louer",
    nav_shortlet: "Locations Courtes",
    nav_invest: "Investir",
    nav_agents: "Agents",
    nav_about: "À Propos",
    cta_explore: "Explorer les Propriétés",
    cta_book: "Réserver une Visite",
    hero_kicker: "THE VHOMES",
    hero_title_1: "Trouvez Votre",
    hero_title_2: "Propriété de Rêve",
    hero_subtitle: "Maisons de Luxe. Investissements Intelligents. Mieux Vivre.",
    search_placeholder: "Rechercher par emplacement, nom...",
  },
  ar: {
    nav_buy: "شراء",
    nav_rent: "إيجار",
    nav_shortlet: "إيجار قصير",
    nav_invest: "استثمار",
    nav_agents: "الوكلاء",
    nav_about: "من نحن",
    cta_explore: "استكشف العقارات",
    cta_book: "احجز معاينة",
    hero_kicker: "ذا في هومز",
    hero_title_1: "اعثر على",
    hero_title_2: "منزل أحلامك",
    hero_subtitle: "منازل فاخرة. استثمارات ذكية. حياة أفضل.",
    search_placeholder: "ابحث حسب الموقع أو الاسم...",
  },
} satisfies Record<Locale, Record<string, string>>;

export function t(locale: Locale, key: keyof typeof dictionary["en"]): string {
  return dictionary[locale]?.[key] ?? dictionary.en[key];
}
