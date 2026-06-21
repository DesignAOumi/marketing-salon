import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { exportCustomersCsv, exportCustomersJson } from "@/lib/data-io";

export const dynamic = "force-dynamic";

// 顧客データのエクスポート（CSV / JSON）。FR-M0-11。認証必須（middleware で保護）。
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const body = await exportCustomersJson();
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="customers-${stamp}.json"`,
      },
    });
  }
  const body = await exportCustomersCsv();
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${stamp}.csv"`,
    },
  });
}
