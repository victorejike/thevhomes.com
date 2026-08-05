import type { Metadata, Viewport } from "next";
import { Providers } from "@/lib/providers";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { CookiePreferencesModal } from "@/components/cookie-preferences-modal";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thevhomes.com"),
  title: {
    default: "TheVHomes | Premium Real Estate Marketplace in Nigeria",
    template: "%s | TheVHomes",
  },
  description:
    "TheVHomes is a premium real estate marketplace and property management platform. Buy, rent, and invest in verified luxury homes, apartments, land, and shortlets across Abuja, Lagos, Dubai, and beyond.",
  keywords: [
    "real estate Nigeria",
    "luxury homes Abuja",
    "property for sale Lagos",
    "shortlet apartments Nigeria",
    "real estate investment",
    "TheVHomes",
  ],
  authors: [{ name: "THE VHOMES LIMITED" }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://thevhomes.com",
    siteName: "TheVHomes",
    title: "TheVHomes | Premium Real Estate Marketplace",
    description:
      "Luxury Homes. Smart Investments. Better Living. Discover verified properties across Nigeria and beyond.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "TheVHomes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TheVHomes | Premium Real Estate Marketplace",
    description: "Luxury Homes. Smart Investments. Better Living.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: "THE VHOMES LIMITED",
              url: "https://thevhomes.com",
              telephone: "+234-806-246-3468",
              email: "thevhomes@gmail.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Abuja",
                addressCountry: "NG",
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <CookieConsentBanner />
          <CookiePreferencesModal />
        </Providers>
      </body>
    </html>
  );
}
