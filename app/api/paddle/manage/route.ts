import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getUserFromRequest } from "@/lib/auth-server";

// POST /api/paddle/manage
// body: { action: "cancel" | "resume" | "update_payment_method" }
// Dashboard → Billing calls this for the three subscription actions
// that need a server-side Paddle API call.
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { action } = await request.json();

  const { data: sub, error } = await supabaseAdmin
    .from("subscriptions")
    .select("paddle_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !sub?.paddle_subscription_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  try {
    if (action === "cancel") {
      // Cancel at the end of the current billing period, so the
      // customer keeps access they already paid for — matches the
      // behavior described in the Refund Policy page.
      await paddle.subscriptions.update(sub.paddle_subscription_id, {
        scheduledChange: { action: "cancel", effectiveAt: "next_billing_period" } as any,
      });
    } else if (action === "resume") {
      // Undo a scheduled cancellation (customer changed their mind
      // before the period ended).
      await paddle.subscriptions.update(sub.paddle_subscription_id, {
        scheduledChange: null,
      });
    } else if (action === "update_payment_method") {
      // Paddle's payment-method update is a hosted flow keyed by a
      // transaction id, not something we can do purely server-side.
      // Return the subscription id so the client can open Paddle's
      // update-payment-method checkout via Paddle.js.
      return NextResponse.json({ paddleSubscriptionId: sub.paddle_subscription_id });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Paddle manage action failed:", err);
    return NextResponse.json({ error: err.message || "Action failed" }, { status: 500 });
  }
}
