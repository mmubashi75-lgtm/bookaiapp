"use client";
// Dashboard → Billing panel. Fetches subscription + invoice data from
// /api/paddle/subscription (authenticated via the existing Supabase
// session — same client already used across the app in lib/supabase.js)
// and lets the owner manage their subscription via /api/paddle/manage.
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPaddle, PADDLE_PRICE_ID } from "@/lib/paddle";
import CheckoutButton from "@/components/pricing/CheckoutButton";

type SubscriptionInfo = {
  status: string;
  nextBilledAt: string | null;
  canceledAt: string | null;
  paddleSubscriptionId: string;
  paddleCustomerId: string;
} | null;

type Invoice = {
  id: string;
  status: string;
  billedAt: string | null;
  total: string | number | null;
  currencyCode: string | null;
  invoiceUrl: string | null;
};

export default function BillingPanel() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [email, setEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function load() {
    setLoading(true);
    setErrorMsg("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    setEmail(sessionData.session?.user?.email);
    setUserId(sessionData.session?.user?.id);

    if (!token) {
      setLoading(false);
      setErrorMsg("You need to be logged in to view billing.");
      return;
    }

    try {
      const res = await fetch("/api/paddle/subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load billing info");
      setSubscription(json.subscription);
      setInvoices(json.invoices || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load billing info");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function callManage(action: "cancel" | "resume" | "update_payment_method") {
    setBusy(true);
    setErrorMsg("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    try {
      const res = await fetch("/api/paddle/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");

      if (action === "update_payment_method" && json.paddleSubscriptionId) {
        const paddle = await getPaddle();
        paddle?.Checkout.open({
          transactionId: undefined,
          items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
          customData: { supabase_user_id: userId },
        } as any);
        // NOTE: Paddle's payment-method-only update flow uses a
        // dedicated `Checkout.open({ transactionId })` call keyed to a
        // transaction created for that purpose. Generating that
        // transaction server-side (via paddle.transactions.create with
        // `collectionMode: 'automatic'` and the existing subscription's
        // customer id) is a small addition on top of this route once
        // you're ready to wire it up — the manage route above already
        // returns the subscription id needed for it.
      } else {
        await load();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed");
    }
    setBusy(false);
  }

  const card: React.CSSProperties = { background: "#fff", borderRadius: 11, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 11 };
  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F5F5F5", fontSize: 13 };

  if (loading) return <div style={{ padding: 20, fontSize: 13, color: "#888" }}>Loading billing info…</div>;

  return (
    <div>
      {errorMsg && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#B91C1C", marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      {!subscription || subscription.status === "none" || subscription.status === "canceled" ? (
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No active subscription</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
            Subscribe to unlock every {`BookAI`} feature — website chat, WhatsApp, AI phone calls, and more.
          </div>
          <CheckoutButton email={email} userId={userId} />
        </div>
      ) : (
        <>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Subscription</div>
            <div style={row}><span>Status</span><strong style={{ textTransform: "capitalize" }}>{subscription.status}</strong></div>
            <div style={row}><span>Next renewal</span><strong>{subscription.nextBilledAt ? new Date(subscription.nextBilledAt).toLocaleDateString() : "—"}</strong></div>
            <div style={row}><span>Subscription ID</span><span style={{ fontFamily: "monospace", fontSize: 11 }}>{subscription.paddleSubscriptionId}</span></div>
            <div style={{ ...row, borderBottom: "none" }}><span>Paddle Customer ID</span><span style={{ fontFamily: "monospace", fontSize: 11 }}>{subscription.paddleCustomerId}</span></div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Manage subscription</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button disabled={busy} onClick={() => callManage("update_payment_method")} style={btn("#0277BD")}>💳 Update payment method</button>
              {subscription.status === "active" ? (
                <button disabled={busy} onClick={() => callManage("cancel")} style={btn("#B91C1C")}>Cancel subscription</button>
              ) : (
                <button disabled={busy} onClick={() => callManage("resume")} style={btn("#00B87A")}>Resume subscription</button>
              )}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Invoice history</div>
            {invoices.length === 0 ? (
              <div style={{ fontSize: 12, color: "#999" }}>No invoices yet.</div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} style={row}>
                  <span>{inv.billedAt ? new Date(inv.billedAt).toLocaleDateString() : "Pending"} · {inv.status}</span>
                  <span>
                    {inv.total ? `${inv.total} ${inv.currencyCode || ""}` : "—"}{" "}
                    {inv.invoiceUrl && (
                      <a href={inv.invoiceUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: "#00B87A" }}>Download</a>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return { padding: "8px 16px", border: "none", borderRadius: 8, background: color, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 };
}
