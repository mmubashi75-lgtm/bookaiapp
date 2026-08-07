// ═══════════════════════════════════════════════════════════════
//  SERVER-SIDE PADDLE CLIENT
//  Used by the webhook (signature verification + event data) and by
//  the billing API route (fetching subscription/invoice details).
//  Requires PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, and PADDLE_ENV.
// ═══════════════════════════════════════════════════════════════
import { Paddle, Environment } from "@paddle/paddle-node-sdk";

export const paddle = new Paddle(process.env.PADDLE_API_KEY || "pdl_placeholder", {
  environment: process.env.PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
});
