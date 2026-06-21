import { describe, it, expect } from "vitest";
import { quintileScores, segmentOf, computeRfm } from "../src/lib/rfm";

describe("rfm (data-model §4.3)", () => {
  it("quintileScores ascending and descending", () => {
    const a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const asc = quintileScores(a, true);
    expect(asc[0]).toBe(1);
    expect(asc[9]).toBe(5);
    const desc = quintileScores(a, false);
    expect(desc[0]).toBe(5);
    expect(desc[9]).toBe(1);
  });

  it("segmentOf prioritizes lapse (at_risk) over loyal", () => {
    expect(segmentOf(5, 5, 5)).toBe("vip");
    expect(segmentOf(5, 1, 1)).toBe("new");
    expect(segmentOf(1, 4, 3)).toBe("at_risk"); // lapsed-but-frequent
    expect(segmentOf(1, 1, 1)).toBe("lost");
    expect(segmentOf(5, 5, 3)).toBe("loyal");
    expect(segmentOf(3, 3, 3)).toBe("stable");
  });

  it("computeRfm assigns vip to best customer; empty → []", () => {
    const inp = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      recencyDays: i * 10,
      frequency: 10 - i,
      monetary: (10 - i) * 10000,
    }));
    const out = computeRfm(inp);
    expect(out.find((x) => x.id === "c0")?.segment).toBe("vip");
    expect(computeRfm([])).toEqual([]);
  });
});
