"use client";
// Lets the business owner connect their Meta WhatsApp Business
// phone number. Requires an active Paddle subscription (or admin).
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function WhatsAppConnectPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      const userId = session?.user?.id;
      const email = (session?.user?.email || "").toLowerCase();
      if (!userId) {
        setLoading(false);
        setError("Please log in first (open /bookai.html and sign in).");
        return;
      }

      // Admin bypass
      const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      let isPro = admins.includes(email);

      if (!isPro && session?.access_token) {
        try {
          const res = await fetch("/api/paddle/subscription", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const json = await res.json();
          const st = json.subscription?.status;
          isPro = st === "active" || st === "trialing";
        } catch {
          /* ignore */
        }
      }

      setAllowed(isPro);
      if (!isPro) {
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase
        .from("businesses")
        .select("whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_connected_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (err) setError(err.message);
      if (data) {
        setPhoneNumberId(data.whatsapp_phone_number_id || "");
        setBusinessAccountId(data.whatsapp_business_account_id || "");
        setConnectedAt(data.whatsapp_connected_at);
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setError("Please log in first.");
      setSaving(false);
      return;
    }

    const { error: err } = await supabase
      .from("businesses")
      .update({
        whatsapp_phone_number_id: phoneNumberId.trim(),
        whatsapp_business_account_id: businessAccountId.trim(),
        whatsapp_connected_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (err) setError(err.message);
    else setConnectedAt(new Date().toISOString());
    setSaving(false);
  }

  const F: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #E2E8F0",
    borderRadius: 9,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading) return <div style={{ padding: 20, fontSize: 13, color: "#888" }}>Loading…</div>;

  if (!allowed) {
    return (
      <div style={{ background: "#fff", borderRadius: 11, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>💬 WhatsApp is a Pro feature</div>
        <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
          Subscribe to connect your Meta WhatsApp Business number and let the AI handle WhatsApp bookings.
        </div>
        <Link
          href="/pricing"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 8,
            background: "linear-gradient(135deg,#00E5A0,#00BCD4)",
            color: "#060B15",
            fontWeight: 800,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          View pricing →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 11, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>💬 Connect WhatsApp Business</div>
      <div
        style={{
          background: "#EFF6FF",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          color: "#1D4ED8",
          marginBottom: 12,
          lineHeight: 1.6,
        }}
      >
        From your <strong>Meta Developer</strong> app → WhatsApp → API Setup, copy the{" "}
        <strong>Phone number ID</strong> and <strong>WhatsApp Business Account ID</strong> below, and make sure the
        webhook URL <code>/api/whatsapp/webhook</code> is subscribed to the <code>messages</code> field.
      </div>
      {error && <div style={{ color: "#B91C1C", fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>
          Phone Number ID
        </label>
        <input
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          placeholder="e.g. 109876543210123"
          style={F}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>
          WhatsApp Business Account ID
        </label>
        <input
          value={businessAccountId}
          onChange={(e) => setBusinessAccountId(e.target.value)}
          placeholder="e.g. 123456789012345"
          style={F}
        />
      </div>
      <button
        onClick={save}
        disabled={saving || !phoneNumberId}
        style={{
          padding: "8px 18px",
          border: "none",
          borderRadius: 8,
          background: phoneNumberId ? "#25D366" : "#CBD5E0",
          color: "#fff",
          cursor: phoneNumberId ? "pointer" : "default",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {connectedAt && (
        <div style={{ fontSize: 11, color: "#999", marginTop: 10 }}>
          Connected: {new Date(connectedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
