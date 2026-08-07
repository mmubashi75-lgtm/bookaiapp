import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-config";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: LEGAL.companyName,
    template: `%s — ${LEGAL.companyName}`,
  },
  description:
    "AI receptionist for small businesses — website chat, WhatsApp booking, and AI phone calls.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <Script id="bookai-admin-emails" strategy="beforeInteractive">{`
          window.__BOOKAI_ADMIN_EMAILS = ${JSON.stringify(adminEmails)};
        `}</Script>
        {children}
      </body>
    </html>
  );
}
