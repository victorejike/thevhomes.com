import type { Metadata } from "next";
import { Cookie, ShieldCheck, BarChart3, Megaphone, Sliders } from "lucide-react";
import { InfoPageShell, InfoSection, InfoCard } from "@/components/info-page-shell";
import { CookiePreferencesLink } from "@/components/cookie-preferences-link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How TheVHomes uses cookies to improve your browsing experience, and how to manage your preferences.",
};

export default function CookiePolicyPage() {
  return (
    <InfoPageShell eyebrow="Legal" title="Cookie Policy" lastUpdated="January 2025">
      <InfoSection title="What Are Cookies?" icon={Cookie}>
        <p>
          Cookies are small text files stored on your device when you visit TheVHomes. They help
          our platform function correctly, remember your preferences, and understand how the site
          is used so we can keep improving it.
        </p>
      </InfoSection>

      <InfoSection title="How TheVHomes Uses Cookies">
        <p>We use cookies to:</p>
        <ul className="mt-2 space-y-2">
          <li>• Improve your overall browsing experience</li>
          <li>• Remember your preferences between visits</li>
          <li>• Keep you signed in to your account</li>
          <li>• Save your selected language</li>
          <li>• Save your dark/light mode preference</li>
          <li>• Improve property recommendations shown to you</li>
          <li>• Measure website performance and reliability</li>
          <li>• Improve search relevance and suggestions</li>
        </ul>
      </InfoSection>

      <InfoSection title="Cookie Categories">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard title="Necessary Cookies">
            <div className="mb-2 text-teal-400">
              <ShieldCheck size={16} />
            </div>
            <p className="text-sm text-white/70">
              Required for core features like signing in, security, and session management.
              These cannot be disabled — the platform cannot function without them.
            </p>
          </InfoCard>
          <InfoCard title="Analytics Cookies">
            <div className="mb-2 text-teal-400">
              <BarChart3 size={16} />
            </div>
            <p className="text-sm text-white/70">
              Help us understand how visitors use TheVHomes so we can measure and improve
              performance and the overall experience.
            </p>
          </InfoCard>
          <InfoCard title="Marketing Cookies">
            <div className="mb-2 text-teal-400">
              <Megaphone size={16} />
            </div>
            <p className="text-sm text-white/70">
              Used to show more relevant property listings and offers across TheVHomes.
            </p>
          </InfoCard>
          <InfoCard title="Preference Cookies">
            <div className="mb-2 text-teal-400">
              <Sliders size={16} />
            </div>
            <p className="text-sm text-white/70">
              Remember your language, theme, saved searches, and other settings so TheVHomes
              feels the same every time you return.
            </p>
          </InfoCard>
        </div>
      </InfoSection>

      <InfoSection title="Managing Your Preferences">
        <p>
          You made a cookie choice the first time you visited TheVHomes, but you can change it at
          any time — necessary cookies always stay on, everything else is entirely up to you.
        </p>
        <CookiePreferencesLink />
      </InfoSection>

      <InfoSection title="Third-Party Cookies">
        <p>
          Some features rely on trusted third parties who may set their own cookies, including
          Google Maps (for property location maps and directions), Paystack and Flutterwave (for
          secure payment processing), and Google OAuth (for &quot;Sign in with Google&quot;). These
          are only active if you use the related feature and, where applicable, only after you
          accept the relevant cookie category above.
        </p>
      </InfoSection>

      <InfoSection title="Changes to This Policy">
        <p>
          We may update this Cookie Policy from time to time. Material changes will be reflected
          with a new &quot;Last updated&quot; date at the top of this page. Continued use of
          TheVHomes after a change means you accept the updated policy.
        </p>
      </InfoSection>

      <InfoSection title="Contact Us">
        <p>
          Questions about this Cookie Policy? Email us at{" "}
          <a href="mailto:thevhomes@gmail.com" className="text-teal-300 underline hover:text-teal-200">
            thevhomes@gmail.com
          </a>
          .
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
