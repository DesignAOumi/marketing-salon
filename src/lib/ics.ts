/**
 * iCalendar(ICS) 生成（M5 / FR-M5-04）。純粋関数・依存なし。RFC 5545 準拠の最小実装。
 * GCal連携なしでも予約を外部カレンダーへ取り込める代替手段。
 */
export type IcsEvent = {
  uid: string;
  start: Date;
  end?: Date | null;
  summary: string;
  description?: string | null;
  cancelled?: boolean;
};

function fmtUtc(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function generateIcs(events: IcsEvent[], now: Date = new Date()): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//salon-customer-tool//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const e of events) {
    const end = e.end ?? new Date(new Date(e.start).getTime() + 60 * 60 * 1000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${esc(e.uid)}@salon-customer-tool`,
      `DTSTAMP:${fmtUtc(now)}`,
      `DTSTART:${fmtUtc(e.start)}`,
      `DTEND:${fmtUtc(end)}`,
      `SUMMARY:${esc(e.summary)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push(`STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
