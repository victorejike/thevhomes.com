export function formatPrice(price: number, currency = "NGN"): string {
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: price >= 1_000_000 ? "compact" : "standard",
  });
  return formatter.format(price);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function propertyTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function purposeLabel(purpose: string): string {
  const map: Record<string, string> = {
    buy: "For Sale",
    rent: "For Rent",
    invest: "Investment",
    shortlet: "Shortlet",
  };
  return map[purpose] ?? purpose;
}
