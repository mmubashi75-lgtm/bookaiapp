"use client";
// Opens Paddle's hosted overlay checkout for the single monthly
// subscription price. Pass `email` if the user is already logged in
// so Paddle pre-fills the checkout and we can match the resulting
// subscription back to their Supabase user via the webhook.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPaddle, PADDLE_PRICE_ID } from "@/lib/paddle";

export default function CheckoutButton(props: {
  email?: string;
  userId?: string; // passed through as custom_data so the webhook can link the subscription
  label?: string;
  style?: React.CSSProperties;
}) {
  const [opening, setOpening] = useState(false);

  async function handleClick() {
  if (!PADDLE_PRICE_ID) {
    alert("Checkout isn't configured yet.");
    return;
  }

  // Require login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in before subscribing.");
    window.location.href = "/bookai.html";
    return;
  }

  setOpening(true);

  try {
    const paddle = await getPaddle();
    if (!paddle) throw new Error("Paddle failed to load");

    paddle.Checkout.open({
      items: [
        {
          priceId: PADDLE_PRICE_ID,
          quantity: 1,
        },
      ],

      customer: {
        email: user.email!,
      },

      customData: {
        supabase_user_id: user.id,
      },
    });
  } catch (err) {
    console.error(err);
    alert("Couldn't open checkout.");
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
      {opening ? "Opening checkout…" : (props.label || "🚀 Subscribe Now")}
    </button>
  );
}
