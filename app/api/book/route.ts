import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/book
 * Body: { slug, customer_name, service, date, time, phone?, id? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, customer_name, service, date, time, phone } = body;

    if (!slug || !customer_name || !service || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields: slug, customer_name, service, date, time" },
        { status: 400 }
      );
    }

    const { data: business, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .select("user_id, id, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (bizErr) throw bizErr;
    if (!business) {
      return NextResponse.json(
        { error: `Business not found for slug: ${slug}` },
        { status: 404 }
      );
    }

    // appointments.id is TEXT PRIMARY KEY with no default — must set it
    const id =
      body.id ||
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    const row = {
      id,
      user_id: business.user_id,
      customer_name,
      service,
      date,
      time,
      phone: phone || "",
      status: "confirmed",
    };

    const { data: appt, error: insertErr } = await supabaseAdmin
      .from("appointments")
      .insert(row)
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, appointment: appt });
  } catch (err: any) {
    console.error("Book API error:", err);
    return NextResponse.json(
      { error: err.message || "Booking failed" },
      { status: 500 }
    );
  }
}
