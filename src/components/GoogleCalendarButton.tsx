"use client";

import Link from "next/link";
import { useState } from "react";

// UIのみ（実OAuthは未実装）。連携済みは青で「連携済み」を表示。
export function GoogleCalendarButton({ connected }: { connected: boolean }) {
  const [open, setOpen] = useState(false);

  if (connected) {
    return (
      <Link
        href="/settings#gcal"
        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        Googleカレンダー連携済み
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-blue-300 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        Googleカレンダー連携
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">Googleカレンダー連携</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
            </div>
            <p className="text-sm text-zinc-600">
              連携を開始するには、Google Cloud で OAuth クライアント（クライアントID / シークレット）を発行し、
              認証情報を登録する必要があります。設定後、このボタンから連携を開始できるようになります。
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-500">
              <li>予約をGoogleカレンダーへ反映（M5）</li>
              <li>認証情報は設定画面で登録します</li>
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <Link
                href="/settings#gcal"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                設定画面へ
              </Link>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
