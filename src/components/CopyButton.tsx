"use client";

import { useState } from "react";

export function CopyButton({ text, label = "連絡文をコピー" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* クリップボード不可環境では無視 */
        }
      }}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100"
    >
      {copied ? "コピーしました" : label}
    </button>
  );
}
