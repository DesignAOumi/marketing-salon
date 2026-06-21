import { describe, it, expect } from "vitest";
import { toCsv, parseCsv } from "../src/lib/csv";

describe("csv (RFC 4180)", () => {
  it("round-trips fields with comma/quote/newline", () => {
    const rows = [
      { a: "x", b: "has, comma", c: 'has "quote"' },
      { a: "y", b: "line\nbreak", c: "" },
    ];
    const csv = toCsv(["a", "b", "c"], rows);
    expect(parseCsv(csv)).toEqual(rows);
  });

  it("quotes fields needing escape", () => {
    expect(toCsv(["x"], [{ x: "a,b" }])).toContain('"a,b"');
  });

  it("strips BOM and parses header", () => {
    expect(parseCsv("﻿a,b\r\n1,2")).toEqual([{ a: "1", b: "2" }]);
  });

  it("skips empty trailing lines", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([{ a: "1", b: "2" }]);
  });
});
