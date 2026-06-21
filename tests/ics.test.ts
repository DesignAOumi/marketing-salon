import { describe, it, expect } from "vitest";
import { generateIcs } from "../src/lib/ics";

describe("ics (RFC 5545)", () => {
  it("emits a valid VCALENDAR with escaped summary", () => {
    const ics = generateIcs(
      [
        {
          uid: "r1",
          start: new Date("2026-06-25T01:00:00Z"),
          end: new Date("2026-06-25T02:00:00Z"),
          summary: "花子（カット, カラー）",
          cancelled: false,
        },
      ],
      new Date("2026-06-22T00:00:00Z"),
    );
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("DTSTART:20260625T010000Z");
    expect(ics).toContain("SUMMARY:花子（カット\\, カラー）");
    expect(ics).toContain("STATUS:CONFIRMED");
    expect(ics.trim().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("defaults end to +60min and marks cancellations", () => {
    const ics = generateIcs([{ uid: "r", start: new Date("2026-06-26T05:00:00Z"), summary: "x", cancelled: true }]);
    expect(ics).toContain("DTEND:20260626T060000Z");
    expect(ics).toContain("STATUS:CANCELLED");
  });
});
