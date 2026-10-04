"use client";
import Vapi from "@vapi-ai/web";

type VapiLike = {
  start: (assistantId: string, opts?: any) => Promise<void>;
  stop: () => void;
  setMuted?: (muted: boolean) => void;
  on: (event: string, cb: (...args: any[]) => void) => void;
  off?: (event: string, cb: (...args: any[]) => void) => void;
};

let instance: VapiLike | null = null;

export function getVapi(): VapiLike {
  if (instance) return instance;
  const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY in .env.local");
  instance = new Vapi(key) as unknown as VapiLike;
  return instance;
}
