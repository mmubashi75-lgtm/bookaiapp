"use client";
// ═══════════════════════════════════════════════════════════════
//  CLIENT-SIDE PADDLE.JS SINGLETON
//  Used by the pricing page for Adaptive Pricing (localized price
//  preview) and by the checkout button to open Paddle's overlay
//  checkout. Requires NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and
//  NEXT_PUBLIC_PADDLE_ENV ("sandbox" | "production").
// ═══════════════════════════════════════════════════════════════
import { initializePaddle, Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;
let initPromise: Promise<Paddle | undefined> | null = null;

export function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return Promise.resolve(paddleInstance);
  if (initPromise) return initPromise;

  initPromise = initializePaddle({
    environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") || "sandbox",
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN as string,
  }).then((p) => {
    paddleInstance = p;
    return p;
  });

  return initPromise;
}

export const PADDLE_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID as string;
