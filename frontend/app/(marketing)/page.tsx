import { HeroSection } from "@/components/hero-section";
import { TrustMetrics } from "@/components/trust-metrics";
import { FeaturedProperties } from "@/components/featured-properties";
import { ServicesSection } from "@/components/services-section";
import { CtaSection } from "@/components/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustMetrics />
      <FeaturedProperties />
      <ServicesSection />
      <CtaSection />
    </>
  );
}
