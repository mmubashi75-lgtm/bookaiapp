import React from "react";
import LegalLayout from "@/components/legal/LegalLayout";
import { LEGAL } from "@/lib/legal-config";

export const metadata = { title: "Refund Policy — " + LEGAL.companyName };

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" updated="August 3, 2026">
      <p>
        We want you to be confident subscribing to {LEGAL.companyName}. This policy explains when
        refunds are available for our single monthly subscription (${LEGAL.priceUSD} USD/month or the
        local-currency equivalent shown at checkout).
      </p>

      <h3 style={h}>1. {LEGAL.refundWindowDays}-day refund window</h3>
      <p>
        If you're not satisfied, you can request a full refund within {LEGAL.refundWindowDays} days of
        your <em>first</em> payment on a new subscription. Contact{" "}
        <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a> with your account
        email and we'll process it — refunds are issued to your original payment method via Paddle,
        typically within 5–10 business days depending on your bank/card provider.
      </p>

      <h3 style={h}>2. Renewal charges</h3>
      <p>
        Because the subscription renews automatically, renewal charges after the first
        {" "}{LEGAL.refundWindowDays}-day window are generally non-refundable, except where required by
        law. To avoid a renewal charge, cancel from Dashboard → Billing before your next renewal date —
        cancelling stops future billing but does not refund the current period.
      </p>

      <h3 style={h}>3. Access after cancellation</h3>
      <p>
        When you cancel, you keep access to {LEGAL.companyName} until the end of the period you already
        paid for. We don't provide partial-period refunds for unused time after cancellation, outside
        the {LEGAL.refundWindowDays}-day window above.
      </p>

      <h3 style={h}>4. Service issues</h3>
      <p>
        If a technical fault on our side (e.g. extended downtime, a billing error, or a duplicate
        charge) affected your ability to use the Service, contact{" "}
        <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a> — we review these on
        a case-by-case basis and may issue a full or partial refund or account credit regardless of the
        refund window above.
      </p>

      <h3 style={h}>5. How to request a refund</h3>
      <p>
        Email <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a> from your
        account's registered email address with your Paddle Subscription ID (found in Dashboard →
        Billing) and the reason for your request.
      </p>

      <h3 style={h}>6. Chargebacks</h3>
      <p>
        Please contact us before filing a chargeback with your bank — we're able to resolve most billing
        issues directly and faster than a chargeback process. Accounts with a fraudulent chargeback may
        be suspended.
      </p>

      <h3 style={h}>7. Contact</h3>
      <p>Questions about this policy: <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a>.</p>

      <p style={{ marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        This document is a general-purpose template and is not a substitute for advice from a qualified
        lawyer in your jurisdiction. Review and adapt it — including the refund window and any
        consumer-protection rules that apply in the countries you sell into — before relying on it.
      </p>
    </LegalLayout>
  );
}

const h: React.CSSProperties = { fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 28, marginBottom: 8 };
const a: React.CSSProperties = { color: "#00E5A0" };
