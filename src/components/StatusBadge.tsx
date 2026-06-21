import type { StatusTone } from "@/lib/customer-status";

const TONE: Record<StatusTone, string> = {
  active: "bg-emerald-100 text-emerald-700",
  new: "bg-sky-100 text-sky-700",
  follow: "bg-amber-100 text-amber-800",
  dormant: "bg-zinc-200 text-zinc-600",
  unknown: "bg-zinc-100 text-zinc-500",
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>
      {label}
    </span>
  );
}
