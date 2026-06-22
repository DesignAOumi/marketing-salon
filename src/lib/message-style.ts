/**
 * 連携なし（オフライン）再来店提案メッセージの組合せ生成エンジン。
 * スタイルガイド（DesignAOumi/sns-message-style-guide）の LINE 向け原則に準拠：
 *  - 短い文・意味ごとの改行・余白（空行）・安定記号（【】▼ ─ ・）・少量の絵文字・型。
 *  - 型: 見出し → 結論 → 本文 → CTA → 添え。装飾は1メッセージ1〜2種、余白が最大の装飾。
 *  - 囲み枠は使わず「上下を線で挟む」方式（スマホで崩れない）。
 * 部品の組合せで 300+ 通りの装飾済みメッセージを生成する。
 */

export type RevisitMessageCtx = {
  name: string;
  lastService?: string | null;
  nextDate?: string | null; // 整形済み（例 2026/03/29）。未確定は null
  staff?: string | null;
  daysSince?: number | null;
  overdue?: boolean; // true=超過 / false=接近
};

// ── 部品（スタイルガイド準拠）─────────────────────────────
const HEADINGS = [
  "【お久しぶりです、{name}様】",
  "【{name}様、お元気ですか？】",
  "【そろそろの時期です、{name}様へ】",
  "【次回ご来店のご案内】",
  "【{name}様へ お知らせ】",
  "【ご無沙汰しております】",
];

const SEPARATORS = ["────────────", "・──────────・", "┈┈┈┈┈┈┈┈┈┈┈┈", "─・─・─・─・─・", "‥‥‥‥‥‥‥‥‥‥"];

const OPEN_OVERDUE = [
  "前回から少しお時間が空きました。",
  "そろそろお手入れの時期かな、とご連絡しました。",
  "気づけば前回から日が経っておりました。",
  "お変わりなくお過ごしでしょうか。",
];
const OPEN_APPROACHING = [
  "そろそろ次回のご来店時期が近づいてきました。",
  "前回の施術から、ちょうど良い頃合いです。",
  "次のお手入れにおすすめのタイミングです。",
  "そろそろ気になる頃ではないでしょうか。",
];

const BODIES = [
  "{name}様にまたお会いできるのを楽しみにしております。",
  "スタッフ一同、心よりお待ちしております。",
  "気になる点があれば、お気軽にご相談ください。",
  "ご都合のよいタイミングでお越しいただけたら嬉しいです。",
  "今のお悩みに合わせてご提案いたします。",
];

const CTAS = [
  "▼ ご予約はこちらから",
  "▼ ご予約・ご相談はお気軽に",
  "▼ ご希望の日時をお知らせください",
  "ご予約はこのメッセージへの返信でも承ります。",
];

const TREATS = [
  "次回ご来店で、ささやかな特典をご用意しております🎁",
  "季節のおすすめメニューもご案内できます🌿",
  "ご来店、心よりお待ちしております✨",
  "",
];

// 文字列ハッシュ（安定シード用）
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt * 7) % arr.length];
}

/** 組合せの理論上の通り数（参考）。 */
export const REVISIT_VARIATIONS =
  HEADINGS.length * SEPARATORS.length * OPEN_OVERDUE.length * BODIES.length * CTAS.length * TREATS.length;

/**
 * 装飾済みの再来店提案メッセージを生成。seed 未指定は氏名から安定生成、
 * 指定（再提案）で別バリエーションになる。
 */
export function composeRevisitMessage(ctx: RevisitMessageCtx, seed?: number): string {
  const s = (seed ?? hash(ctx.name)) >>> 0;
  const name = ctx.name;
  const sub = (t: string) => t.replace(/\{name\}/g, name);

  const heading = sub(pick(HEADINGS, s, 1));
  const sep = pick(SEPARATORS, s, 2);
  const opening = pick(ctx.overdue === false ? OPEN_APPROACHING : OPEN_OVERDUE, s, 3);
  const body = sub(pick(BODIES, s, 4));
  const cta = pick(CTAS, s, 5);
  const treat = pick(TREATS, s, 6);

  // 文脈の添え（前回施術 / 次回予測日 / 担当）。空行＋短文で余白を活かす。
  const ctxLines: string[] = [];
  if (ctx.lastService) ctxLines.push(`前回は「${ctx.lastService}」をご利用いただきました。`);
  if (ctx.nextDate) ctxLines.push(`次回の目安は ${ctx.nextDate} 頃です。`);
  const sign = ctx.staff ? `担当：${ctx.staff} より` : "";

  // 型: 見出し → (空行) → 結論 → 区切り → 本文ブロック → 区切り → CTA → (空行) → 添え → 署名
  const lines: string[] = [];
  lines.push(heading);
  lines.push("");
  lines.push(opening);
  lines.push(sep);
  if (ctxLines.length) {
    lines.push(...ctxLines);
  }
  lines.push(body);
  lines.push(sep);
  lines.push(cta);
  if (treat) {
    lines.push("");
    lines.push(treat);
  }
  if (sign) {
    lines.push("");
    lines.push(sign);
  }

  // 空行は3行以上続けない（スタイルガイド）。連続空行を1つに圧縮。
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** スタイルガイドの要点（連携ありAIのプロンプトに注入する共通ルール）。 */
export const STYLE_GUIDE_RULES = [
  "LINE向けに読みやすく整える。文字そのものを太字/色で飾らない。",
  "短い文（1文30〜45字目安）・意味ごとの改行・余白（空行）で読みやすくする。空行は3行以上続けない。",
  "見出しは【】を基本。区切り線は ──────── など端末幅で折り返さない長さ（全角12字目安）。",
  "型は 見出し→結論→本文→CTA→添え。要点とCTA（▼ ご予約はこちら 等）は前半〜中盤に置く。",
  "絵文字は少量（1メッセージ1個程度）。意味を絵文字だけに依存させない。囲み枠（┌─┐）は使わず上下を線で挟む。",
  "宛名は『{NAME}様』の形を保持（匿名化トークンを壊さない）。誇大・断定的な表現や過度な値引き訴求はしない。",
].join("\n");
