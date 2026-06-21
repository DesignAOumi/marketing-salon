import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { listReservations } from "@/lib/reservations";
import { generateIcs, type IcsEvent } from "@/lib/ics";

export const dynamic = "force-dynamic";

// 予約の ICS エクスポート（FR-M5-04）。?pii=off で顧客名を含めない（公開範囲配慮 / FR-M5-05）。
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const includeNames = req.nextUrl.searchParams.get("pii") !== "off";
  const reservations = await listReservations();

  const events: IcsEvent[] = reservations.map((r) => {
    const who = includeNames ? r.customer.name : `予約 #${r.id.slice(-6)}`;
    const summary = r.memo ? `${who}（${r.memo}）` : who;
    return {
      uid: r.id,
      start: r.startAt,
      end: r.endAt,
      summary,
      description: r.staff?.name ? `担当: ${r.staff.name}` : null,
      cancelled: r.status === "cancelled" || r.status === "noshow",
    };
  });

  const body = generateIcs(events, new Date());
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="salon-reservations.ics"`,
    },
  });
}
