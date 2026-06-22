"use client";

import { useState } from "react";

const LINKS = [
  { label: "APIキー発行ページ（Console → API keys）", href: "https://console.anthropic.com/settings/keys" },
  { label: "Anthropic Console（トップ）", href: "https://console.anthropic.com" },
  { label: "公式ドキュメント（API はじめに）", href: "https://docs.anthropic.com/en/api/getting-started" },
  { label: "ヘルプセンター（サポート）", href: "https://support.anthropic.com/" },
];

export function ApiKeyHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-blue-600 underline hover:no-underline"
      >
        ❓ APIキーの取得方法を見る
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-4">
              <h3 className="text-base font-bold text-zinc-900">Claude APIキーの取得方法</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="rounded-md px-2 py-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700">
              <li>
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Anthropic Console
                </a>
                にアクセスし、アカウントを作成（またはログイン）します。
              </li>
              <li>支払い方法を登録し、クレジットを購入します（API利用は従量課金です）。</li>
              <li>
                左メニューまたは設定の{" "}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  「API keys」
                </a>
                を開きます。
              </li>
              <li>「Create Key」でキーを発行し、表示された <code className="rounded bg-zinc-100 px-1">sk-ant-…</code> をコピーします（<strong>一度しか表示されません</strong>のでご注意ください）。</li>
              <li>このキーを下の「Claude APIキー」欄に貼り付けます。</li>
            </ol>

            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              ※ Console の画面構成・名称は今後変更される可能性があります。最新の手順は下記の公式サイトをご確認ください。
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-zinc-500">参考サイト</p>
              <ul className="space-y-1 text-sm">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:no-underline">
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
