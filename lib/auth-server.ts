// Small helper: verify a Supabase access token sent from the client
// (Authorization: Bearer <token>) and return the user, using the
// service-role client (which can validate any user's JWT).
import { supabaseAdmin } from "./supabase-admin";

export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
