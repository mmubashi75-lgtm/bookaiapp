"use client";
import Link from "next/link";
import WhatsAppConnectPanel from "@/components/whatsapp/WhatsAppConnectPanel";

export default function DashboardWhatsAppPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F8" }}>
      <div style={{ background: "#111827", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>🤖 BookAI · WhatsApp</div>
        <Link href="/bookai.html" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textDecoration: "none" }}>← Back to Dashboard</Link>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 14 }}>
        <WhatsAppConnectPanel />
      </div>
    </div>
  );
}
