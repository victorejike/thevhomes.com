import { CountUp } from "./count-up";

const METRICS = [
  { end: 1200, suffix: "+", label: "Verified Properties" },
  { end: 350, suffix: "+", label: "Trusted Agents" },
  { end: 8500, suffix: "+", label: "Happy Clients" },
  { prefix: "₦", end: 45, suffix: "B+", label: "Transactions Facilitated" },
];

export function TrustMetrics() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 lg:grid-cols-4 lg:px-8">
        {METRICS.map((m) => (
          <div key={m.label} className="text-center">
            <div className="font-display text-3xl font-semibold text-teal-300 sm:text-4xl">
              <CountUp end={m.end} prefix={m.prefix} suffix={m.suffix} />
            </div>
            <div className="mt-1 text-sm text-white/60">{m.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
