import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function backToLogin(origin: string, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, origin));
}

/** メールのマジックリンクを踏んだときの着地点。 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase 側で弾かれたときは理由がクエリに乗ってくる
  const errorCode = searchParams.get("error_code");
  if (errorCode) {
    return backToLogin(origin, errorCode === "otp_expired" ? "expired" : "denied");
  }

  const supabase = await createClient();

  // 既定の PKCE フロー。Supabase が検証を終えて ?code= を付けて戻してくる。
  // 交換にはリンクを要求したブラウザに残る code_verifier が要る。
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", origin));
    return backToLogin(origin, "exchange");
  }

  // メールのテンプレートを token_hash 形式に差し替えた場合はこちらで届く
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL("/", origin));
    return backToLogin(origin, "expired");
  }

  return backToLogin(origin, "link");
}
