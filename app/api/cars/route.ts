import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "missing",
    envKeyStart: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) || "missing",
  });
}