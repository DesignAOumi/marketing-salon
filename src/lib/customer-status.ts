/**
 * 顧客の表示ステータス導出（純粋関数）。spec-appendix §A / §B に準拠。
 * M1 時点では来店サイクル（avgVisitIntervalDays）が未算出（M3で実装）のため、
 * 永続 status と 最終来店からの経過日数で表示カテゴリを導出する。
 *
 * 3軸（§A）:
 *  ① 永続ステータス status: new / repeat / dormant
 *  ② 来店サイクル状態 cycleState（派生・M3で精緻化）
 *  ③ RFMセグメント（M4）
 */

export const DORMANT_DAYS_DEFAULT = 180; // 既定の休眠閾値（§A: avgVisitInterval×3 または 180日）

export type StatusTone = "new" | "active" | "follow" | "dormant" | "unknown";

export type DerivedStatus = {
  /** 永続ステータス（DB保存値の再判定） */
  persistent: "new" | "repeat" | "dormant";
  /** 最終来店からの経過日数（未来店は null） */
  daysSinceLastVisit: number | null;
  /** 画面表示ラベル */
  label: string;
  tone: StatusTone;
};

export function daysSince(date: Date | null | undefined, now: Date = new Date()): number | null {
  if (!date) return null;
  const ms = now.getTime() - new Date(date).getTime();
  return Math.floor(ms / 86_400_000);
}

type CustomerLike = {
  visitCount: number;
  lastVisitDate: Date | null;
  avgVisitIntervalDays?: number | null;
};

/** 永続ステータスを来店実績から再判定する（FR-M1-09 / §A）。 */
export function computePersistentStatus(
  c: CustomerLike,
  now: Date = new Date(),
): "new" | "repeat" | "dormant" {
  const d = daysSince(c.lastVisitDate, now);
  const dormantThreshold =
    c.avgVisitIntervalDays && c.avgVisitIntervalDays > 0
      ? c.avgVisitIntervalDays * 3
      : DORMANT_DAYS_DEFAULT;
  if (d !== null && d > dormantThreshold) return "dormant";
  if (c.visitCount <= 1) return "new";
  return "repeat";
}

/** 画面表示用の派生ステータス（ラベル＋トーン）。 */
export function deriveStatus(c: CustomerLike, now: Date = new Date()): DerivedStatus {
  const daysSinceLastVisit = daysSince(c.lastVisitDate, now);
  const persistent = computePersistentStatus(c, now);

  if (persistent === "dormant") {
    return { persistent, daysSinceLastVisit, label: "休眠", tone: "dormant" };
  }
  if (daysSinceLastVisit === null) {
    return { persistent, daysSinceLastVisit, label: "未来店", tone: "unknown" };
  }
  if (persistent === "new") {
    return { persistent, daysSinceLastVisit, label: "新規", tone: "new" };
  }
  // repeat：休眠閾値の半分を超えたら「要フォロー」表示（簡易・M3で精緻化）
  const followThreshold =
    c.avgVisitIntervalDays && c.avgVisitIntervalDays > 0
      ? c.avgVisitIntervalDays
      : DORMANT_DAYS_DEFAULT / 2;
  if (daysSinceLastVisit > followThreshold) {
    return { persistent, daysSinceLastVisit, label: "要フォロー", tone: "follow" };
  }
  return { persistent, daysSinceLastVisit, label: "アクティブ", tone: "active" };
}
