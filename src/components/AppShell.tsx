"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { themeBg, themeHeader } from "@/lib/theme";

type Session = { name: string; email: string | null; role: string };

// 将来フェーズで各画面を追加する（screens.md の画面一覧）。
const NAV = [
  { href: "/dashboard", label: "ダッシュボード", enabled: true },
  { href: "/customers", label: "顧客カルテ", enabled: true },
  { href: "/sales", label: "売上・購買", enabled: true },
  { href: "/reservations", label: "予約・来店サイクル", enabled: true },
  { href: "/suggestions", label: "再来店提案", enabled: true },
  { href: "/data", label: "データ入出力", enabled: true },
  { href: "/settings", label: "設定", enabled: true },
];

export function AppShell({
  session,
  appTitle,
  theme,
  logout,
  children,
}: {
  session: Session;
  appTitle: string;
  theme: string;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className={`border-b border-black/10 px-5 py-4 ${themeHeader(theme)}`}>
        <p className="text-sm font-bold leading-snug text-zinc-900">{appTitle}</p>
        <p className="text-xs text-zinc-500">セルフホスト / v0.1</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return item.enabled ? (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm ${
                active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
              }`}
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
          );
        })}
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
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* PC: 常時表示サイドバー */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white lg:block">
        {SidebarContent}
      </aside>

      {/* モバイル: ドロワー + 背景 */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-zinc-200 bg-white transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarContent}
      </aside>

      {/* 本体 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* モバイル: 上部バー（ハンバーガー） */}
        <header className={`flex items-center gap-3 border-b border-black/10 px-4 py-3 lg:hidden ${themeHeader(theme)}`}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="メニューを開く"
            className="rounded-md border border-zinc-500 bg-white px-2.5 py-1.5 text-zinc-800 shadow-sm hover:bg-zinc-100"
          >
            ☰
          </button>
          <span className="truncate text-sm font-bold text-zinc-900">{appTitle}</span>
        </header>
        <main className={`flex-1 overflow-auto p-4 sm:p-6 lg:p-8 ${themeBg(theme)}`}>{children}</main>
      </div>
    </div>
  );
}
