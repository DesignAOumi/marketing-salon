import { describe, it, expect } from "vitest";
import {
  intervalsFromDates,
  median,
  avgVisitInterval,
  predictNextVisit,
  cycleOverdueRatio,
  cycleState,
  computeCycle,
} from "../src/lib/cycle";

const D = (s: string) => new Date(s + "T00:00:00Z");

describe("cycle engine (spec-appendix §B)", () => {
  it("intervalsFromDates returns day diffs", () => {
    expect(intervalsFromDates([D("2026-01-01"), D("2026-01-31"), D("2026-03-02"), D("2026-04-01")])).toEqual([30, 30, 30]);
  });

  it("median handles odd/even/unsorted/empty", () => {
    expect(median([30, 30, 30])).toBe(30);
    expect(median([10, 20])).toBe(15);
    expect(median([5, 1, 3])).toBe(3);
    expect(median([])).toBeNull();
  });

  it("avgVisitInterval = median of intervals; null under 2 visits", () => {
    expect(avgVisitInterval([D("2026-01-01"), D("2026-01-31"), D("2026-03-02"), D("2026-04-01")])).toBe(30);
    expect(avgVisitInterval([D("2026-01-01")])).toBeNull();
  });

  it("predictNextVisit adds interval", () => {
    expect(predictNextVisit(D("2026-04-01"), 30)?.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(predictNextVisit(null, 30)).toBeNull();
  });

  it("cycleOverdueRatio", () => {
    expect(cycleOverdueRatio(45, 30)).toBe(1.5);
    expect(cycleOverdueRatio(null, 30)).toBeNull();
  });

  it("cycleState thresholds (§B.2)", () => {
    expect(cycleState(0.5, 10)).toBe("before");
    expect(cycleState(0.9, 27)).toBe("approaching");
    expect(cycleState(1.2, 36)).toBe("overdue");
    expect(cycleState(3.5, 100)).toBe("dormant");
    expect(cycleState(0.5, 200)).toBe("dormant"); // daysSince >= 180
    expect(cycleState(null, null)).toBe("unknown");
  });

  it("computeCycle integration", () => {
    const c = computeCycle([D("2026-01-01"), D("2026-01-31"), D("2026-03-02"), D("2026-04-01")], D("2026-05-16"));
    expect(c.avgVisitIntervalDays).toBe(30);
    expect(c.daysSinceLastVisit).toBe(45);
    expect(c.cycleOverdueRatio).toBe(1.5);
    expect(c.cycleState).toBe("overdue");
    expect(c.nextPredictedVisitDate?.toISOString().slice(0, 10)).toBe("2026-05-01");
  });
});
