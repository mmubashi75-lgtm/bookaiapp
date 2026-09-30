import Link from "next/link";
import CheckoutButton from "@/components/pricing/CheckoutButton";
import { LEGAL } from "@/lib/legal-config";

export const metadata = { title: "Pricing — " + LEGAL.companyName };

const PLANS = [
  {
    id: "simple",
    name: "Simple",
    price: `$${LEGAL.priceUSD}`,
    period: "/ month",
    minutes: 100,
    blurb: "Everything you need to start. 100 AI voice minutes included.",
    features: [
      "AI website chat booking, 24/7",
      "WhatsApp booking (Meta Cloud API)",
      "AI phone answering",
      "100 Vapi voice minutes / month",
      "Owner dashboard & bookings",
      "Unlimited services & FAQs",
      "Reminders & branding",
    ],
    priceEnv: "NEXT_PUBLIC_PADDLE_PRICE_ID",
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99",
    period: "/ month",
    minutes: 300,
    blurb: "For busy shops. 300 AI voice minutes every month.",
    features: [
      "Everything in Simple",
      "300 Vapi voice minutes / month",
      "Priority support",
      "Higher call volume capacity",
    ],
    priceEnv: "NEXT_PUBLIC_PADDLE_PRICE_ID_GROWTH",
    popular: true,
  },
  {
    id: "pro_voice",
    name: "Pro Voice",
    price: "$199",
    period: "/ month",
    minutes: 1000,
    blurb: "High volume. 1000 AI voice minutes / month.",
    features: [
      "Everything in Growth",
      "1000 Vapi voice minutes / month",
      "Best for multi-line / multi-location",
    ],
    priceEnv: "NEXT_PUBLIC_PADDLE_PRICE_ID_PRO_VOICE",
    popular: false,
  },
];

// Top-up: $0.40/min standard · $0.35/min for 500+ and 1000 packs
const PACKS = [
  { id: "pack_50", name: "+50 minutes", price: "$20", rate: "$0.40/min", minutes: 50, env: "NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_50" },
  { id: "pack_100", name: "+100 minutes", price: "$40", rate: "$0.40/min", minutes: 100, env: "NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_100" },
  { id: "pack_300", name: "+300 minutes", price: "$120", rate: "$0.40/min", minutes: 300, env: "NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_300" },
  { id: "pack_500", name: "+500 minutes", price: "$175", rate: "$0.35/min · save 12%", minutes: 500, env: "NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_500" },
  { id: "pack_1000", name: "+1000 minutes", price: "$350", rate: "$0.35/min · best value", minutes: 1000, env: "NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_1000" },
];

function priceIdFromEnv(envKey: string): string {
  return process.env[envKey] || process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || "";
}

export default function PricingPage() {
  return (
    <div style={{ background: "#060B15", color: "#F0F4FF", minHeight: "100vh" }}>
      <nav
        style={{
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "sticky",
          top: 0,
          background: "rgba(6,11,21,0.97)",
          zIndex: 100,
        }}
      >
        <Link href="/" style={{ fontWeight: 900, fontSize: 20, color: "#fff", textDecoration: "none" }}>
          🤖 {LEGAL.companyName}
        </Link>
        <Link href="/bookai.html" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          Dashboard
        </Link>
      </nav>

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 900, marginBottom: 10 }}>
          Simple pricing. Voice minutes included.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 520, margin: "0 auto 36px" }}>
          Pick a plan for your monthly AI voice allowance. Need more calls? Buy top-up minutes anytime.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
            textAlign: "left",
          }}
        >
          {PLANS.map((p) => {
            const pid = priceIdFromEnv(p.priceEnv);
            return (
              <div
                key={p.id}
                style={{
                  background: p.popular
                    ? "linear-gradient(160deg,rgba(0,229,160,0.12),rgba(124,58,237,0.1))"
                    : "rgba(255,255,255,0.03)",
                  border: p.popular
                    ? "1.5px solid rgba(0,229,160,0.45)"
                    : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 18,
                  padding: 22,
                  position: "relative",
                }}
              >
                {p.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      background: "#00E5A0",
                      color: "#060B15",
                      fontSize: 10,
                      fontWeight: 900,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
                  {p.name.toUpperCase()}
                </div>
                <div style={{ margin: "10px 0 4px" }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: "#00E5A0" }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{p.period}</span>
                </div>
                <div style={{ fontSize: 13, color: "#00E5A0", fontWeight: 700, marginBottom: 8 }}>
                  📞 {p.minutes} voice minutes / month
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>{p.blurb}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                      <span style={{ color: "#00E5A0" }}>✓ </span>
                      {f}
                    </div>
                  ))}
                </div>
                <CheckoutButton priceId={pid} label={`Subscribe — ${p.name}`} style={{ width: "100%" }} />
              </div>
            );
          })}
        </div>
      </section>

      <section id="minutes" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 60px" }}>
        <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          Need more minutes?
        </h2>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 8 }}>
          Standard rate <strong style={{ color: "#00E5A0" }}>$0.40 / minute</strong>
          {" · "}
          Bulk 500+ &amp; 1000: <strong style={{ color: "#00E5A0" }}>$0.35 / minute</strong>
        </p>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 24 }}>
          One-time top-ups stack on your plan limit and stay until used.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
          }}
        >
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: pack.minutes >= 500 ? "1.5px solid rgba(0,229,160,0.35)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: 18,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800 }}>{pack.name}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#25D366", margin: "8px 0 2px" }}>
                {pack.price}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
                {pack.rate}
              </div>
              <CheckoutButton
                priceId={priceIdFromEnv(pack.env)}
                label="Buy top-up"
                style={{ width: "100%", background: "#25D366", padding: "10px 16px", fontSize: 13 }}
              />
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 12,
          color: "rgba(255,255,255,0.3)",
        }}
      >
        <Link href="/privacy" style={{ color: "inherit", margin: "0 8px" }}>
          Privacy
        </Link>
        <Link href="/terms" style={{ color: "inherit", margin: "0 8px" }}>
          Terms
        </Link>
        <Link href="/refund" style={{ color: "inherit", margin: "0 8px" }}>
          Refunds
        </Link>
      </footer>
    </div>
  );
}
