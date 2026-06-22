import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  exportSalesCsv,
  exportSalesJson,
  exportReservationsCsv,
  exportReservationsJson,
  exportAnalyticsCsv,
  exportAnalyticsJson,
} from "@/lib/data-io";

export const dynamic = "force-dynamic";

// 売上 / 予約 / 分析のエクスポート（CSV / JSON）。/customers と /ics は専用ルート。
const MAP: Record<string, { csv: () => Promise<string>; json: () => Promise<string> }> = {
  sales: { csv: exportSalesCsv, json: exportSalesJson },
  reservations: { csv: exportReservationsCsv, json: exportReservationsJson },
  analytics: { csv: exportAnalyticsCsv, json: exportAnalyticsJson },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { type } = await params;
  const entry = MAP[type];
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new NextResponse(await entry.json(), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${stamp}.json"`,
      },
    });
  }
  return new NextResponse(await entry.csv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${stamp}.csv"`,
    },
  });
}
