"use client";

import { useState, useTransition } from "react";
import { CopyButton } from "@/components/CopyButton";

export function SuggestionMessage({
  initial,
  regenerate,
}: {
  initial: string;
  regenerate: () => Promise<{ message: string | null; error?: string }>;
}) {
  const [msg, setMsg] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <p className="whitespace-pre-wrap text-sm text-zinc-800">{msg}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CopyButton text={msg} />
        <button
          type="button"
          onClick={() =>
            start(async () => {
              setErr(null);
              const r = await regenerate();
              if (r.message) setMsg(r.message);
              else setErr(r.error ?? "再生成に失敗しました。");
            })
          }
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          {pending ? "考え中…" : "♻️ 再提案"}
        </button>
        {err ? <span className="text-xs text-red-600">{err}</span> : null}
      </div>
    </div>
  );
}
