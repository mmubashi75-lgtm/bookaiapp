import { NextResponse } from "next/server";
import {
  EventName,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionActivatedEvent,
  SubscriptionCanceledEvent,
} from "@paddle/paddle-node-sdk";
import { paddle } from "@/lib/paddle-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { applyTopUp, TOPUP_PACKS } from "@/lib/vapi-usage";

// Paddle sends events for the ONE subscription price this app sells.
// We upsert a single `subscriptions` row per Supabase user, keyed by
// the `supabase_user_id` passed as custom_data at checkout (see
// components/pricing/CheckoutButton.tsx).
export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature") || "";
  const rawBody = await request.text();

  let eventData;
  try {
    eventData = await paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET as string,
      signature
    );
  } catch (err) {
    console.error("Paddle webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!eventData) {
    return NextResponse.json({ error: "Empty event" }, { status: 400 });
  }

  try {
    switch (eventData.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated: {
        const sub = eventData.data as
          | SubscriptionCreatedEvent["data"]
          | SubscriptionUpdatedEvent["data"]
          | SubscriptionActivatedEvent["data"];

        const supabaseUserId = (sub.customData as any)?.supabase_user_id;

        if (!supabaseUserId) {
          console.warn(
            "Paddle subscription event with no supabase_user_id in custom_data — subscription id:",
            sub.id
          );
          break;
        }

        const priceId = sub.items?.[0]?.price?.id || null;

        const { error } = await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: supabaseUserId,
            paddle_customer_id: sub.customerId,
            paddle_subscription_id: sub.id,
            paddle_price_id: priceId,
            status: sub.status,
            next_billed_at: sub.nextBilledAt || null,
            canceled_at: sub.status === "canceled" ? new Date().toISOString() : null,
          },
          { onConflict: "user_id" }
        );

        if (error) throw error;

        // Map Paddle price → BookAI plan + monthly minute limit
        const priceMap: Record<string, { plan: string; minutes: number }> = {
          [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || ""]: { plan: "simple", minutes: 100 },
          [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GROWTH || ""]: { plan: "growth", minutes: 300 },
          [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO_VOICE || ""]: { plan: "pro_voice", minutes: 1000 },
        };
        const mapped = priceId ? priceMap[priceId] : null;
        if (mapped) {
          await supabaseAdmin
            .from("businesses")
            .update({
              subscription_plan: mapped.plan,
              monthly_minutes_limit: mapped.minutes,
            })
            .eq("user_id", supabaseUserId);
        } else {
          // Default simple plan minutes on any paid subscription
          await supabaseAdmin
            .from("businesses")
            .update({
              subscription_plan: "simple",
              monthly_minutes_limit: 100,
            })
            .eq("user_id", supabaseUserId);
        }
        break;
      }

      case EventName.SubscriptionCanceled: {
        const sub = eventData.data as SubscriptionCanceledEvent["data"];

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", sub.id);

        if (error) throw error;
        break;
      }

      case EventName.TransactionCompleted: {
        const txn = eventData.data as any;
        const supabaseUserId =
          txn.customData?.supabase_user_id ||
          txn.custom_data?.supabase_user_id;
        const priceId =
          txn.items?.[0]?.price?.id ||
          txn.details?.lineItems?.[0]?.priceId ||
          null;

        if (!supabaseUserId || !priceId) break;

        const packMap: Record<string, { pack: string; minutes: number }> = {
          [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_50 || ""]: {
            pack: "pack_50",
            minutes: TOPUP_PACKS.pack_50,
          },
          [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_100 || ""]: {
            pack: "pack_100",
            minutes: TOPUP_PACKS.pack_100,
          },
          [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_300 || ""]: {
            pack: "pack_300",
            minutes: TOPUP_PACKS.pack_300,
          },
        };
        const pack = packMap[priceId];
        if (pack && pack.minutes) {
          await applyTopUp({
            userId: supabaseUserId,
            minutes: pack.minutes,
            pack: pack.pack,
            paddleTxnId: txn.id,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Paddle webhook handling failed:", err);
    return NextResponse.json({ error: err.message || "Webhook handling failed" }, { status: 500 });
  }
}
