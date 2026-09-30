"use client";
import { useState } from "react";
import { getPaddle, PADDLE_PRICE_ID } from "@/lib/paddle";

export default function CheckoutButton(props: {
  email?: string;
  userId?: string;
  label?: string;
  priceId?: string; // override default subscription price
  style?: React.CSSProperties;
}) {
  const [opening, setOpening] = useState(false);
  const priceId = props.priceId || PADDLE_PRICE_ID;

  async function handleClick() {
    if (!priceId) {
      alert("Checkout isn't configured yet — missing Paddle price id.");
      return;
    }
    setOpening(true);
    try {
      const paddle = await getPaddle();
      if (!paddle) throw new Error("Paddle failed to load");

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        ...(props.email ? { customer: { email: props.email } } : {}),
        customData: props.userId
          ? { supabase_user_id: props.userId, price_id: priceId }
          : { price_id: priceId },
      });
    } catch (err) {
      console.error(err);
      alert("Couldn't open checkout. Please try again in a moment.");
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
