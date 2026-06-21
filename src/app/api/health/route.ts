import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ヘルスチェック（認証不要・middleware の PUBLIC_PATHS に登録済み）。
// Docker HEALTHCHECK / リバースプロキシの死活監視に使用。外部送信は行わない。
export function GET() {
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
