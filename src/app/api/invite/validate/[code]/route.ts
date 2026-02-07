import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory rate limiter for invite code validation
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 attempts per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// GET /api/invite/validate/:code - Check if invite code is valid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Rate limit to prevent code enumeration attacks
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらく待ってから再試行してください", status: 429 },
        { status: 429 }
      );
    }

    const { code } = await params;
    const supabase = await createClient();

    const { data: invite } = await supabase
      .from("invite_codes")
      .select("id, code, expires_at")
      .eq("code", code)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (!invite) {
      return NextResponse.json({
        data: { valid: false },
        status: 200,
      });
    }

    return NextResponse.json({
      data: { valid: true, expiresAt: invite.expires_at },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
