import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AIAssistant } from "@/components/ai-assistant";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-charcoal-950">{children}</main>
      <Footer />
      <AIAssistant />
    </>
  );
}
