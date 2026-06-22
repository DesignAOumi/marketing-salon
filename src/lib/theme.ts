// 背景テーマカラーのプリセット。bg/swatch はリテラルで持ち、Tailwind のスキャン対象にする。
export const THEMES = [
  { key: "zinc", label: "グレー", bg: "bg-zinc-50", swatch: "bg-zinc-300" },
  { key: "blue", label: "ブルー", bg: "bg-blue-50", swatch: "bg-blue-300" },
  { key: "emerald", label: "グリーン", bg: "bg-emerald-50", swatch: "bg-emerald-300" },
  { key: "rose", label: "ピンク", bg: "bg-rose-50", swatch: "bg-rose-300" },
  { key: "amber", label: "アンバー", bg: "bg-amber-50", swatch: "bg-amber-300" },
  { key: "violet", label: "パープル", bg: "bg-violet-50", swatch: "bg-violet-300" },
  { key: "sky", label: "スカイ", bg: "bg-sky-50", swatch: "bg-sky-300" },
  { key: "stone", label: "ベージュ", bg: "bg-stone-100", swatch: "bg-stone-300" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];

export function themeBg(key?: string | null): string {
  return THEMES.find((t) => t.key === key)?.bg ?? "bg-zinc-50";
}

export function isThemeKey(v: string): v is ThemeKey {
  return THEMES.some((t) => t.key === v);
}
