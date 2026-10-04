// ═══════════════════════════════════════════════════════════════
//  SERVICE-ROLE SUPABASE CLIENT (server-only)
//  Mirrors the same client already created inline in
//  app/api/book/route.ts — extracted here so the Paddle webhook and
//  billing API routes don't each re-instantiate their own. Never
//  import this from client components.
// ═══════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key"
);
