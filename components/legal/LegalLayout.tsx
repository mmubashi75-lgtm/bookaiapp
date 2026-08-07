import React from "react";
import Link from "next/link";
import { LEGAL } from "@/lib/legal-config";

export default function LegalLayout(props: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#060B15", color: "#F0F4FF", minHeight: "100vh" }}>
      <nav style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, background: "rgba(6,11,21,0.97)", zIndex: 100 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 20, color: "#fff", textDecoration: "none" }}>
          <span>🤖</span>
          <span style={{ background: "linear-gradient(135deg,#00E5A0,#00BCD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{LEGAL.companyName}</span>
        </Link>
        <div style={{ display: "flex", gap: 18, fontSize: 13 }}>
          <Link href="/pricing" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Pricing</Link>
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Terms</Link>
          <Link href="/refund" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Refunds</Link>
        </div>
      </nav>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 900, marginBottom: 6 }}>{props.title}</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 32 }}>Last updated: {props.updated}</p>
        <div style={{ fontSize: 14, lineHeight: 1.85, color: "rgba(240,244,255,0.82)" }}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
