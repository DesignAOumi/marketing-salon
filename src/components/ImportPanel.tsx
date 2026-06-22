"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Success = { created: number; updated: number; errors: { row: number; message: string }[] };
type Result = Success | { error: string };

export function ImportPanel() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const trimmed = text.trimStart();
      const isJson =
        file.name.toLowerCase().endsWith(".json") ||
        trimmed.startsWith("[") ||
        trimmed.startsWith("{");
      const res = await fetch("/api/import/customers", {
        method: "POST",
        headers: { "Content-Type": isJson ? "application/json" : "text/csv" },
        body: text,
      });
      const json = (await res.json()) as Result;
      setResult(json);
      if (res.ok) router.refresh();
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        <a
          href="/api/import/template"
          download
          className="font-medium text-zinc-900 underline hover:no-underline"
        >
          📄 CSVテンプレート（フォーマット）をダウンロード
        </a>
        <p className="mt-1 leading-relaxed">
          列: <code>id</code>, <code>name</code>(氏名・必須), <code>nameKana</code>,{" "}
          <code>gender</code>(female/male/other), <code>birthday</code>(YYYY-MM-DD),{" "}
          <code>phone</code>, <code>email</code>, <code>hairType</code>, <code>skinType</code>,{" "}
          <code>allergies</code>(<code>;</code> 区切り), <code>preferences</code>, <code>notes</code>,{" "}
          <code>consentToContact</code>(true/false)。<code>id</code> を空欄にすると新規、既存の id を入れると上書き更新します。
        </p>
      </div>
      <input
        type="file"
        accept=".csv,.json,text/csv,application/json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-700"
      />
      <button
        type="submit"
        disabled={!file || busy}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
      >
        {busy ? "取り込み中…" : "インポート実行"}
      </button>

      {result ? (
        "error" in result ? (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {result.error}
          </p>
        ) : (
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-sm">
            <p className="font-medium text-zinc-800">
              取込完了：新規 {result.created} 件 / 更新 {result.updated} 件 / エラー{" "}
              {result.errors.length} 件
            </p>
            {result.errors.length > 0 ? (
              <ul className="mt-2 space-y-0.5 text-xs text-red-600">
                {result.errors.slice(0, 20).map((e) => (
                  <li key={e.row}>
                    {e.row} 行目: {e.message}
                  </li>
                ))}
                {result.errors.length > 20 ? <li>…ほか {result.errors.length - 20} 件</li> : null}
              </ul>
            ) : null}
          </div>
        )
      ) : null}
    </form>
  );
}
