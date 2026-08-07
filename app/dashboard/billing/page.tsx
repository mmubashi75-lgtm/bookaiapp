"use client";
// Standalone billing page. The main Dashboard UI still lives inside
// bookai.html (a static asset, not a Next.js route), so this page is
// reached via a normal link rather than the dashboard's internal tab
// switcher. Add a "💳 Billing" button in bookai.html's existing
// Settings tab pointing here, e.g.:
//
//   e("a", { href: "/dashboard/billing", style: {...} }, "💳 Billing")
//
// next to the existing "Upgrade to Pro" / plan block.
import Link from "next/link";
import BillingPanel from "@/components/billing/BillingPanel";

export default function DashboardBillingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F8" }}>
      <div style={{ background: "#111827", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>🤖 BookAI · Billing</div>
        <Link href="/bookai.html" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textDecoration: "none" }}>← Back to Dashboard</Link>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 14 }}>
        <BillingPanel />
      </div>
    </div>
  );
}
