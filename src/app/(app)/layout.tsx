import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { logout } from "./actions";

// 将来フェーズで各画面を追加する（screens.md の画面一覧10）。Phase 0 はダッシュボード枠のみ。
const NAV = [
  { href: "/dashboard", label: "ダッシュボード", enabled: true },
  { href: "/customers", label: "顧客カルテ (M1)", enabled: true },
  { href: "/sales", label: "売上・購買 (M2)", enabled: false },
  { href: "/reservations", label: "予約・来店サイクル (M3)", enabled: false },
  { href: "/analytics", label: "分析ダッシュボード (M4)", enabled: false },
  { href: "/suggestions", label: "再来店提案 (M6)", enabled: false },
  { href: "/settings", label: "設定 (M0)", enabled: false },
];

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <p className="text-sm font-bold text-zinc-900">サロン顧客管理</p>
          <p className="text-xs text-zinc-400">セルフホスト / v0.1</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) =>
            item.enabled ? (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.href}
                aria-disabled
                className="block cursor-not-allowed rounded-md px-3 py-2 text-sm text-zinc-300"
                title="今後のフェーズで実装"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className="border-t border-zinc-200 p-3">
          <p className="px-2 pb-2 text-xs text-zinc-500">
            {session.name || session.email}（{session.role}）
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              ログアウト
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
