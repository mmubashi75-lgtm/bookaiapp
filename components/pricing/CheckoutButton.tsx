"use client";
import { useState } from "react";
import { getPaddle, PADDLE_PRICE_ID } from "@/lib/paddle";

export default function CheckoutButton(props: {
  email?: string;
  userId?: string;
  label?: string;
  priceId?: string;
  style?: React.CSSProperties;
}) {
  const [opening, setOpening] = useState(false);
  // Do NOT fall back to Simple price for packs/growth — empty means misconfigured
  const priceId = (props.priceId || "").trim() || (PADDLE_PRICE_ID || "").trim();
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";

  async function handleClick() {
    console.log("[BookAI checkout]", {
      priceId: props.priceId || "(fallback simple)",
      resolved: priceId,
      hasToken: !!clientToken,
      env: process.env.NEXT_PUBLIC_PADDLE_ENV,
    });

    if (!clientToken) {
      alert(
        "Checkout not configured.\n\nAdd NEXT_PUBLIC_PADDLE_CLIENT_TOKEN in Vercel → Environment Variables, then Redeploy."
      );
      return;
    }
    if (!priceId) {
      alert(
        "This product has no Paddle Price ID.\n\nFor the 300-minute pack set:\nNEXT_PUBLIC_PADDLE_PRICE_ID_PACK_300=pri_...\n\nExact name required (include PACK_300). Then Redeploy."
      );
      return;
    }

    setOpening(true);
    try {
      const paddle = await getPaddle();
      if (!paddle) {
        throw new Error(
          "Paddle.js failed to load. Check NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and NEXT_PUBLIC_PADDLE_ENV (sandbox | production)."
        );
      }

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        ...(props.email ? { customer: { email: props.email } } : {}),
        customData: {
          ...(props.userId ? { supabase_user_id: props.userId } : {}),
          price_id: priceId,
        },
        settings: {
          displayMode: "overlay",
          theme: "dark",
        },
      });
    } catch (err: any) {
      console.error("Paddle checkout error:", err);
      alert(
        "Couldn't open checkout.\n\n" +
          (err?.message || String(err)) +
          "\n\nPrice ID used: " +
          priceId +
          "\n\nCheck:\n1) Price ID is from the same mode as the token (sandbox/live)\n2) Domain allowed in Paddle → Checkout settings\n3) Product is Active in Paddle"
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={opening}
      style={{
        padding: "13px 28px",
        border: "none",
        borderRadius: 12,
        background: "linear-gradient(135deg,#00E5A0,#00BCD4)",
        color: "#060B15",
        cursor: opening ? "default" : "pointer",
        fontSize: 14,
        fontWeight: 900,
        opacity: opening ? 0.7 : 1,
        ...props.style,
      }}
    >
      {opening ? "Opening checkout…" : props.label || "🚀 Subscribe Now"}
    </button>
  );
}
