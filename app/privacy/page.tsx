import React from "react";
import LegalLayout from "@/components/legal/LegalLayout";
import { LEGAL } from "@/lib/legal-config";

export const metadata = { title: "Privacy Policy — " + LEGAL.companyName };

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="August 3, 2026">
      <p>
        This Privacy Policy explains how {LEGAL.legalEntityName} ("{LEGAL.companyName}", "we", "us")
        collects, uses, and protects information when you use our website, dashboard, AI chat,
        AI voice call, and WhatsApp booking services (the "Service").
      </p>

      <h3 style={h}>1. Who this applies to</h3>
      <p>
        This policy covers two kinds of users: <strong>business owners</strong> who sign up to run
        an AI receptionist for their business, and <strong>end customers</strong> who chat, call, or
        message a business's AI receptionist to book an appointment.
      </p>

      <h3 style={h}>2. Information we collect</h3>
      <ul style={ul}>
        <li>Account information: name, email address, password (hashed via Supabase Auth), business details you provide (name, hours, address, services, FAQs).</li>
        <li>Booking information: customer name, phone number, service, date and time of appointment, and appointment status.</li>
        <li>Conversation content: messages exchanged with the AI receptionist via website chat, WhatsApp, or phone call transcripts, so the AI can carry context and business owners can review conversations.</li>
        <li>Billing information: subscription status, next renewal date, and invoice history. Card and payment details are collected and stored entirely by our payment processor, Paddle — we never see or store full card numbers.</li>
        <li>Technical information: IP address (used only for approximate country/currency detection on the pricing page), browser type, and basic usage logs for debugging and abuse prevention.</li>
      </ul>

      <h3 style={h}>3. How we use information</h3>
      <ul style={ul}>
        <li>To operate the AI receptionist: booking, cancelling, and rescheduling appointments.</li>
        <li>To send appointment reminders via website chat, WhatsApp, or phone.</li>
        <li>To process subscription payments and keep your billing status in sync.</li>
        <li>To improve reliability and detect abuse or fraud.</li>
        <li>We do not sell personal information to third parties.</li>
      </ul>

      <h3 style={h}>4. Third-party processors</h3>
      <p>We share the minimum necessary data with the following processors so the Service can function:</p>
      <ul style={ul}>
        <li><strong>Supabase</strong> — database and authentication hosting.</li>
        <li><strong>Anthropic</strong> — powers the AI receptionist's replies. Conversation text is sent to Anthropic's API to generate a response.</li>
        <li><strong>Paddle</strong> — payment processing, subscription billing, and tax/VAT compliance.</li>
        <li><strong>Meta (WhatsApp Cloud API)</strong> — delivers and receives WhatsApp messages on behalf of subscribed businesses.</li>
        <li><strong>Vapi</strong> — powers AI phone call handling for businesses on the voice-enabled plan.</li>
      </ul>

      <h3 style={h}>5. Data retention</h3>
      <p>
        We retain account and booking data for as long as your account is active, and for a reasonable
        period after cancellation to comply with legal, tax, and dispute-resolution obligations. You can
        request deletion of your business account and associated data at any time by contacting{" "}
        <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a>.
      </p>

      <h3 style={h}>6. Your rights</h3>
      <p>
        Depending on your location, you may have the right to access, correct, export, or delete your
        personal information. To exercise these rights, contact us at{" "}
        <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a>.
      </p>

      <h3 style={h}>7. Security</h3>
      <p>
        We use industry-standard measures (encrypted connections, hashed passwords, row-level security
        on our database) to protect your data. No method of transmission or storage is 100% secure, and
        we cannot guarantee absolute security.
      </p>

      <h3 style={h}>8. Children's privacy</h3>
      <p>The Service is intended for business use and is not directed at children under 16.</p>

      <h3 style={h}>9. Changes to this policy</h3>
      <p>We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated date.</p>

      <h3 style={h}>10. Contact</h3>
      <p>Questions about this policy: <a href={"mailto:" + LEGAL.supportEmail} style={a}>{LEGAL.supportEmail}</a>.</p>

      <p style={{ marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        This document is a general-purpose template and is not a substitute for advice from a qualified
        lawyer in your jurisdiction ({LEGAL.jurisdiction}). Review and adapt it before relying on it.
      </p>
    </LegalLayout>
  );
}

const h: React.CSSProperties = { fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 28, marginBottom: 8 };
const ul: React.CSSProperties = { paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 };
const a: React.CSSProperties = { color: "#00E5A0" };
