/**
 * 来店サイクル算出エンジン（純粋関数）。spec-appendix §B / data-model §4.1 準拠。
 *  - avgVisitIntervalDays = 直近 N 回（既定6）の連続来店間隔の「中央値」（外れ値に頑健）。
 *  - 来店2回未満（間隔0件）は null（算出不可）。
 *  - nextPredictedVisitDate = lastVisitDate + avgVisitIntervalDays。
 *  - cycleOverdueRatio = daysSinceLastVisit / avgVisitIntervalDays。
 * 決定論性のため基準日（today）は引数で注入する。
 */

export const DEFAULT_LAST_N = 6;

/** 来店日（昇順でなくてよい）→ 連続間隔（日数）配列。 */
export function intervalsFromDates(dates: (Date | string)[]): number[] {
  const ms = dates.map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  const out: number[] = [];
  for (let i = 1; i < ms.length; i++) {
    out.push(Math.round((ms[i] - ms[i - 1]) / 86_400_000));
  }
  return out;
}

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** 平均来店間隔（直近 N 間隔の中央値）。間隔が無ければ null。 */
export function avgVisitInterval(
  dates: (Date | string)[],
  lastN: number = DEFAULT_LAST_N,
): number | null {
  const iv = intervalsFromDates(dates);
  if (iv.length < 1) return null;
  return median(iv.slice(-lastN));
}

export function predictNextVisit(
  lastVisit: Date | string | null,
  avgInterval: number | null,
): Date | null {
  if (!lastVisit || avgInterval === null) return null;
  const d = new Date(lastVisit);
  d.setUTCDate(d.getUTCDate() + Math.round(avgInterval));
  return d;
}

export function daysSince(date: Date | string | null, today: Date): number | null {
  if (!date) return null;
  return Math.floor((today.getTime() - new Date(date).getTime()) / 86_400_000);
}

export function cycleOverdueRatio(
  daysSinceLastVisit: number | null,
  avgInterval: number | null,
): number | null {
  if (daysSinceLastVisit === null || avgInterval === null || avgInterval <= 0) return null;
  return daysSinceLastVisit / avgInterval;
}

export type CycleState = "before" | "approaching" | "overdue" | "dormant" | "unknown";

/** §B.2 のしきい値で来店サイクル状態を判定。 */
export function cycleState(ratio: number | null, daysSinceLastVisit: number | null): CycleState {
  if (daysSinceLastVisit !== null && daysSinceLastVisit >= 180) return "dormant";
  if (ratio === null) return "unknown";
  if (ratio >= 3.0) return "dormant";
  if (ratio >= 1.0) return "overdue";
  if (ratio >= 0.8) return "approaching";
  return "before";
}

export const CYCLE_STATE_LABEL: Record<CycleState, string> = {
  before: "予測前",
  approaching: "接近",
  overdue: "超過",
  dormant: "離反",
  unknown: "算出不可",
};

/** 顧客1名の来店サイクル指標をまとめて算出（表示・M6抽出で共用）。 */
export function computeCycle(
  visitDates: (Date | string)[],
  today: Date,
): {
  avgVisitIntervalDays: number | null;
  nextPredictedVisitDate: Date | null;
  daysSinceLastVisit: number | null;
  cycleOverdueRatio: number | null;
  cycleState: CycleState;
} {
  const sorted = [...visitDates].map((d) => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  const last = sorted[sorted.length - 1] ?? null;
  const avg = avgVisitInterval(sorted);
  const dsl = daysSince(last, today);
  const ratio = cycleOverdueRatio(dsl, avg);
  return {
    avgVisitIntervalDays: avg,
    nextPredictedVisitDate: predictNextVisit(last, avg),
    daysSinceLastVisit: dsl,
    cycleOverdueRatio: ratio,
    cycleState: cycleState(ratio, dsl),
  };
}
