import Vapi from "@vapi-ai/web";

let vapi;

export function getVapi() {
  if (!vapi) {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) throw new Error("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY");
    vapi = new Vapi(key);
  }
  return vapi;
}
