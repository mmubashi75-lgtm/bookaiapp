import React from "react";
import LegalLayout from "@/components/legal/LegalLayout";
import { LEGAL } from "@/lib/legal-config";

export const metadata = { title: "Terms of Service — " + LEGAL.companyName };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="August 3, 2026">
      <p>
        These Terms of Service ("Terms") govern your use of {LEGAL.companyName}, an AI receptionist
        platform operated by {LEGAL.legalEntityName}. By creating an account or subscribing, you agree
        to these Terms.
      </p>

      <h3 style={h}>1. The Service</h3>
      <p>
        {LEGAL.companyName} provides an AI receptionist for small businesses, including website chat
        booking, WhatsApp booking, AI phone call answering, an owner dashboard, and appointment
        management. Features available to your account depend on your active subscription.
      </p>

      <h3 style={h}>2. Subscription &amp; billing</h3>
      <ul style={ul}>
        <li>{LEGAL.companyName} is offered as a single monthly subscription at ${LEGAL.priceUSD} USD/month (or the equivalent in your local currency, as shown at checkout), billed automatically until cancelled.</li>
        <li>Payments are processed by Paddle, our Merchant of Record. Paddle handles applicable sales tax/VAT and appears as the seller on your card statement and invoices.</li>
        <li>Subscriptions renew automatically each billing cycle unless cancelled before the renewal date.</li>
        <li>You can cancel anytime from Dashboard → Billing. Access continues until the end of the paid period.</li>
        <li>Refunds are governed by our <a href="/refund" style={a}>Refund Policy</a>.</li>
      </ul>

      <h3 style={h}>3. Acceptable use</h3>
      <p>You agree not to use the Service to:</p>
      <ul style={ul}>
        <li>Send spam, unsolicited marketing, or bulk messages via WhatsApp in violation of Meta's WhatsApp Business Policy.</li>
        <li>Book or contact customers without a lawful basis to do so.</li>
        <li>Attempt to reverse-engineer, disrupt, or overload the Service.</li>
        <li>Use the Service for any unlawful, fraudulent, or harmful purpose.</li>
      </ul>
      <p>We may suspend or terminate accounts that violate these Terms or Meta's/Paddle's own policies, which apply in addition to these Terms.</p>

      <h3 style={h}>4. Your content and data</h3>
      <p>
        You retain ownership of your business data (services, FAQs, bookings, branding assets). You
        grant us a license to store and process it solely to operate the Service on your behalf, as
        described in our <a href="/privacy" style={a}>Privacy Policy</a>.
      </p>

      <h3 style={h}>5. AI-generated responses</h3>
      <p>
        The AI receptionist generates conversational replies and booking actions automatically based on
        the business information you provide. While we work to make this reliable, AI responses may
        occasionally be inaccurate. You are responsible for reviewing your business's bookings and
        configuration (hours, services, FAQs) for accuracy.
      </p>

      <h3 style={h}>6. Availability</h3>
      <p>
        We aim for high availability but do not guarantee uninterrupted service. The Service depends on
        third-party providers (Supabase, Anthropic, Paddle, Meta, Vapi) whose outages may affect
        availability.
      </p>

      <h3 style={h}>7. Limitation of liability</h3>
      <p>
        To the maximum extent permitted by law, {LEGAL.companyName} is not liable for indirect,
        incidental, or consequential damages, including lost bookings or lost revenue, arising from use
        of the Service.
      </p>

      <h3 style={h}>8. Termination</h3>
      <p>
        You may stop using the Service and cancel your subscription at any time. We may suspend or
        terminate accounts for violation of these Terms, non-payment, or misuse of third-party services
        integrated into {LEGAL.companyName}.
      </p>

      <h3 style={h}>9. Changes to these Terms</h3>
      <p>We may update these Terms from time to time. Continued use of the Service after changes means you accept the updated Terms.</p>

      <h3 style={h}>10. Governing law</h3>
      <p>These Terms are governed by the laws of {LEGAL.jurisdiction}, without regard to conflict-of-law principles.</p>

      <h3 style={h}>11. Contact</h3>
      <p>Questions about these Terms: <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a>.</p>

      <p style={{ marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        This document is a general-purpose template and is not a substitute for advice from a qualified
        lawyer in your jurisdiction. Review and adapt it before relying on it.
      </p>
    </LegalLayout>
  );
}

const h: React.CSSProperties = { fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 28, marginBottom: 8 };
const ul: React.CSSProperties = { paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 };
const a: React.CSSProperties = { color: "#00E5A0" };
