"use client";
// Uses Paddle's Adaptive Pricing (PricePreview) to show the $59/mo
// price localized to the visitor's detected currency. Falls back to
// a plain "$59/mo" if Paddle hasn't loaded yet or the request fails
// (e.g. ad-blockers, offline, missing env vars in local dev).
import { useEffect, useState } from "react";
import { getPaddle, PADDLE_PRICE_ID } from "@/lib/paddle";
import { LEGAL } from "@/lib/legal-config";

export default function LocalizedPrice(props: { className?: string; style?: React.CSSProperties }) {
  const [display, setDisplay] = useState<string>(`$${LEGAL.priceUSD}`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!PADDLE_PRICE_ID) {
      setLoading(false);
      return;
    }

    getPaddle()
      .then((paddle) => {
        if (!paddle || cancelled) return;
        return paddle
          .PricePreview({
            items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
          })
          .then((result: any) => {
            if (cancelled) return;
            const lineItem = result?.data?.details?.lineItems?.[0];
            const formatted = lineItem?.formattedTotals?.total;
            if (formatted) setDisplay(formatted);
          });
      })
      .catch((err) => {
        console.error("Paddle price preview failed, showing USD fallback:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className={props.className} style={props.style} aria-live="polite">
      {display}
      {loading && <span style={{ opacity: 0.5, fontSize: "0.5em", marginLeft: 6 }}>…</span>}
    </span>
  );
}
