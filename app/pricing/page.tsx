"use client";
import Link from "next/link";
import LocalizedPrice from "@/components/pricing/LocalizedPrice";
import CheckoutButton from "@/components/pricing/CheckoutButton";
import { LEGAL } from "@/lib/legal-config";

export const metadata = { title: "Pricing — " + LEGAL.companyName };

const G = "linear-gradient(135deg,#00E5A0,#00BCD4)";

const FEATURES = [
  "AI website chat booking, 24/7",
  "WhatsApp booking via Meta Cloud API",
  "AI phone call answering",
  "Owner dashboard with live bookings",
  "Unlimited services & FAQs",
  "Automatic appointment reminders",
  "Business branding (logo, cover, gallery, service photos)",
  "Priority support",
];

const COMPARISON = [
  { label: "Monthly cost", them: "Rs. 25,000–40,000 (front-desk salary)", us: "One flat monthly subscription" },
  { label: "Availability", them: "Business hours only, sick days, turnover", us: "24/7, never misses a call or message" },
  { label: "Channels covered", them: "Phone only, usually", us: "Website chat + WhatsApp + phone calls" },
  { label: "Setup time", them: "Weeks of hiring & training", us: "Minutes" },
];

const FAQS = [
  { q: "Is this really just one price?", a: "Yes — one monthly subscription. Every feature is included for every subscriber. No hidden tiers, no per-feature upsells." },
  { q: "Which currency will I be charged in?", a: "Checkout automatically shows and charges in your local currency based on your location, powered by our payment processor Paddle." },
  { q: "Can I cancel anytime?", a: "Yes, anytime from Dashboard → Billing. You keep access until the end of your current billing period." },
  { q: "Do you offer refunds?", a: "Yes — full refunds within 7 days of your first payment. See our Refund Policy for details." },
  { q: "Who processes my payment?", a: "Paddle, our Merchant of Record, handles payment, tax/VAT, and appears on your card statement." },
];

export default function PricingPage() {
  return (
    <div style={{ background: "#060B15", color: "#F0F4FF", minHeight: "100vh" }}>
      {/* nav */}
      <nav style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "rgba(6,11,21,0.97)", zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 20, color: "#fff", textDecoration: "none" }}>
          <span>🤖</span>
          <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{LEGAL.companyName}</span>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/bookai.html" style={{ padding: "8px 18px", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Log in</Link>
        </div>
      </nav>

      {/* hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "56px 20px 30px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#00E5A0", fontWeight: 700, marginBottom: 20, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          Simple, Honest Pricing
        </div>
        <h1 style={{ fontSize: "clamp(28px,7vw,44px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 14 }}>
          One plan. <span style={{ background: G, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Everything included.</span>
        </h1>
        <p style={{ fontSize: 15, color: "rgba(240,244,255,0.5)", lineHeight: 1.8, marginBottom: 8, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          No Starter, no Pro, no Enterprise. Every {LEGAL.companyName} subscriber gets every feature — website chat, WhatsApp, and AI phone calls — for one price.
        </p>
      </section>

      {/* price card */}
      <section style={{ maxWidth: 420, margin: "0 auto", padding: "20px 20px 50px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(0,229,160,0.3)", borderRadius: 20, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{LEGAL.companyName} Subscription</div>
          <div style={{ margin: "14px 0 4px" }}>
            <LocalizedPrice style={{ fontSize: 44, fontWeight: 900, color: "#00E5A0" }} />
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>/ month</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>Price shown in your local currency · cancel anytime</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, textAlign: "left" }}>
            {FEATURES.map((f) => (
              <div key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", display: "flex", gap: 8 }}>
                <span style={{ color: "#00E5A0", flexShrink: 0 }}>✓</span>{f}
              </div>
            ))}
          </div>
          <CheckoutButton style={{ width: "100%" }} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>
            {LEGAL.refundWindowDays}-day money-back guarantee · <Link href="/refund" style={{ color: "rgba(255,255,255,0.5)" }}>Refund Policy</Link>
          </div>
        </div>
      </section>

      {/* comparison */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "10px 20px 50px" }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(18px,4vw,26px)", fontWeight: 900, marginBottom: 24 }}>
          {LEGAL.companyName} vs. hiring a receptionist
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 1, background: "rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ background: "#0A1220", padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}> </div>
          <div style={{ background: "#0A1220", padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>Front-desk staff</div>
          <div style={{ background: "#0A1220", padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "#00E5A0" }}>{LEGAL.companyName}</div>
          {COMPARISON.map((row) => (
            <div key={row.label} style={{ display: "contents" }}>
              <div style={{ background: "#0A1220", padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{row.label}</div>
              <div style={{ background: "#0A1220", padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{row.them}</div>
              <div style={{ background: "#0A1220", padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{row.us}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 680, margin: "0 auto", padding: "10px 20px 60px" }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(18px,4vw,26px)", fontWeight: 900, marginBottom: 24 }}>Pricing FAQ</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((f) => (
            <div key={f.q} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "#fff" }}>{f.q}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* trust + CTA */}
      <section style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 60px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
          🔒 Secure checkout by Paddle · 💳 Major cards, local payment methods · 🌍 Localized pricing in 190+ countries
        </div>
        <CheckoutButton label="🚀 Get Started Today" />
      </section>

      <div style={{ padding: "22px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", color: "rgba(255,255,255,0.28)", fontSize: 12, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms of Service</Link>
        <Link href="/refund" style={{ color: "inherit", textDecoration: "none" }}>Refund Policy</Link>
      </div>
    </div>
  );
}
