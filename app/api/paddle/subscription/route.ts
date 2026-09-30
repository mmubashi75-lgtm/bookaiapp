import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getUserFromRequest } from "@/lib/auth-server";

// GET /api/paddle/subscription
// Returns the caller's subscription status + live invoice history
// from Paddle. Used by Dashboard → Billing.
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: sub, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!sub || !sub.paddle_subscription_id) {
    return NextResponse.json({ subscription: null, invoices: [] });
  }

  let invoices: any[] = [];
  try {
    const transactions = await paddle.transactions.list({
      subscriptionId: [sub.paddle_subscription_id],
      perPage: 24,
    });

    for await (const txn of transactions) {
      let invoiceUrl: string | null = null;
      try {
        const invoice = await paddle.transactions.getInvoicePDF(txn.id);
        invoiceUrl = invoice.url || null;
      } catch (e) {
        // Some transaction states (e.g. not yet billed) have no invoice yet.
      }

      invoices.push({
        id: txn.id,
        status: txn.status,
        billedAt: txn.billedAt,
        total: txn.details?.totals?.total,
        currencyCode: txn.currencyCode,
        invoiceUrl,
      });
    }
  } catch (err) {
    console.error("Failed to load Paddle invoices:", err);
  }

  return NextResponse.json({
    subscription: {
      status: sub.status,
      nextBilledAt: sub.next_billed_at,
      canceledAt: sub.canceled_at,
      paddleSubscriptionId: sub.paddle_subscription_id,
      paddleCustomerId: sub.paddle_customer_id,
    },
    invoices,
  });
}
