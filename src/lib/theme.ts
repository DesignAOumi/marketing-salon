// 背景テーマカラーのプリセット。bg(背景)/header(ヘッダー)/swatch(選択)はリテラルで持ち、
// Tailwind のスキャン対象にする。
export const THEMES = [
  { key: "zinc", label: "グレー", bg: "bg-zinc-100", header: "bg-zinc-200", swatch: "bg-zinc-300" },
  { key: "blue", label: "ブルー", bg: "bg-blue-100", header: "bg-blue-200", swatch: "bg-blue-400" },
  { key: "emerald", label: "グリーン", bg: "bg-emerald-100", header: "bg-emerald-200", swatch: "bg-emerald-400" },
  { key: "rose", label: "ピンク", bg: "bg-rose-100", header: "bg-rose-200", swatch: "bg-rose-400" },
  { key: "amber", label: "アンバー", bg: "bg-amber-100", header: "bg-amber-200", swatch: "bg-amber-400" },
  { key: "violet", label: "パープル", bg: "bg-violet-100", header: "bg-violet-200", swatch: "bg-violet-400" },
  { key: "sky", label: "スカイ", bg: "bg-sky-100", header: "bg-sky-200", swatch: "bg-sky-400" },
  { key: "stone", label: "ベージュ", bg: "bg-stone-100", header: "bg-stone-200", swatch: "bg-stone-300" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];

const find = (key?: string | null) => THEMES.find((t) => t.key === key);

export function themeBg(key?: string | null): string {
  return find(key)?.bg ?? "bg-zinc-100";
}

export function themeHeader(key?: string | null): string {
  return find(key)?.header ?? "bg-zinc-200";
}

export function isThemeKey(v: string): v is ThemeKey {
  return THEMES.some((t) => t.key === v);
}
