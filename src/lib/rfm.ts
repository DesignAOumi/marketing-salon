/**
 * RFM 分析（純粋関数）。data-model §4.3 準拠。
 *  - R(Recency)/F(Frequency)/M(Monetary) を全顧客内の五分位でスコア1〜5に割当。
 *    Recency は「小さいほど良い」ので反転（最近来店ほど高スコア）。
 *  - (R,F,M) の組合せからセグメントラベル（vip/loyal/stable/new/at_risk/lost）を導出。
 */

export type RfmInput = {
  id: string;
  recencyDays: number | null; // 最終来店からの経過日数（未来店は null＝最低）
  frequency: number; // 来店回数
  monetary: number; // 累計売上
};

export type RfmSegment = "vip" | "loyal" | "stable" | "new" | "at_risk" | "lost";

export type RfmScore = {
  id: string;
  r: number;
  f: number;
  m: number;
  segment: RfmSegment;
};

export const RFM_SEGMENT_LABEL: Record<RfmSegment, string> = {
  vip: "優良(VIP)",
  loyal: "常連",
  stable: "安定",
  new: "新規",
  at_risk: "離反リスク",
  lost: "離反",
};

/** 値配列を順位ベースで五分位スコア(1〜5)に割当。higherIsBetter=false は降順評価。 */
export function quintileScores(values: number[], higherIsBetter = true): number[] {
  const n = values.length;
  if (n === 0) return [];
  const order = values
    .map((v, i) => ({ v, i }))
    .sort((a, b) => (higherIsBetter ? a.v - b.v : b.v - a.v));
  const scores = new Array<number>(n).fill(3);
  order.forEach((o, rank) => {
    const q = Math.min(4, Math.floor((rank / n) * 5)); // 0..4（下位ほど0）
    scores[o.i] = q + 1; // 1..5
  });
  return scores;
}

export function segmentOf(r: number, f: number, m: number): RfmSegment {
  if (r >= 4 && f >= 4 && m >= 4) return "vip";
  // 最近性が低い顧客はまず離反系で判定（高頻度でも recency 低下なら「離反リスク」）
  if (r <= 2 && f >= 3) return "at_risk";
  if (r <= 2 && f <= 2) return "lost";
  if (f >= 4 && m >= 3) return "loyal";
  if (r >= 4 && f <= 2) return "new";
  return "stable";
}

export function computeRfm(inputs: RfmInput[]): RfmScore[] {
  if (inputs.length === 0) return [];
  const LARGE = Number.MAX_SAFE_INTEGER;
  const rScores = quintileScores(
    inputs.map((x) => (x.recencyDays === null ? LARGE : x.recencyDays)),
    false, // recency は小さいほど高スコア
  );
  const fScores = quintileScores(inputs.map((x) => x.frequency), true);
  const mScores = quintileScores(inputs.map((x) => x.monetary), true);
  return inputs.map((x, i) => ({
    id: x.id,
    r: rScores[i],
    f: fScores[i],
    m: mScores[i],
    segment: segmentOf(rScores[i], fScores[i], mScores[i]),
  }));
}
