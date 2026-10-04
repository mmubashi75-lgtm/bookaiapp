import { NextResponse } from "next/server";

// Public config for the static bookai.html dashboard (no secrets).
export async function GET() {
  return NextResponse.json({
    adminEmails: process.env.NEXT_PUBLIC_ADMIN_EMAILS || "",
  });
}
