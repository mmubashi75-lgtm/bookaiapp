// ═══════════════════════════════════════════════════════════════
//  SERVER-SIDE APPOINTMENT HELPERS (service-role)
//  cancelAppointmentByName mirrors dbDeleteApptByName() from
//  bookai.html exactly (same match logic: user_id + case-insensitive
//  customer_name). There's currently no dedicated /api/cancel route
//  to reuse the way /api/book is reused for booking, so this is the
//  one small server-side helper the WhatsApp webhook needs that
//  doesn't already exist elsewhere — not a duplicate of booking
//  logic, since booking itself still goes through the existing
//  /api/book route as required.
// ═══════════════════════════════════════════════════════════════
import { supabaseAdmin } from "./supabase-admin";

export async function findBusinessByWhatsAppPhoneNumberId(phoneNumberId: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("whatsapp_phone_number_id", phoneNumberId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadApptsForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id, name: row.customer_name, service: row.service,
    date: row.date, time: row.time, status: row.status, phone: row.phone || "",
  }));
}

export async function cancelAppointmentByName(userId: string, name: string) {
  const { error } = await supabaseAdmin
    .from("appointments")
    .delete()
    .eq("user_id", userId)
    .ilike("customer_name", name);
  if (error) throw error;
}
