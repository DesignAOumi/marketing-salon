import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { importCustomerRecords } from "@/lib/data-io";
import { parseCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// 顧客データのインポート（CSV / JSON）。FR-M0-12。認証必須。
// SameSite=lax Cookie によりクロスサイト POST では Cookie が送られず CSRF を緩和。
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let records: Record<string, unknown>[] = [];
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      records = Array.isArray(body)
        ? body
        : Array.isArray((body as { customers?: unknown })?.customers)
          ? (body as { customers: Record<string, unknown>[] }).customers
          : [];
    } else {
      const text = await req.text();
      records = parseCsv(text);
    }
  } catch (e) {
    return NextResponse.json(
      { error: "パースに失敗しました: " + (e instanceof Error ? e.message : String(e)) },
      { status: 400 },
    );
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "取り込むレコードがありません。" }, { status: 400 });
  }

  const result = await importCustomerRecords(records);
  return NextResponse.json(result);
}
