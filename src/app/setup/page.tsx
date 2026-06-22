import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { listServices } from "@/lib/services";
import { getOnboarding, ONBOARDING_STEPS, TOTAL_STEPS } from "@/lib/onboarding";
import { AccountStep } from "@/components/setup/AccountStep";
import { SalonStep } from "@/components/setup/SalonStep";
import { CustomersStep } from "@/components/setup/CustomersStep";
import { MenusStep } from "@/components/setup/MenusStep";
import { AiStep } from "@/components/setup/AiStep";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { step, completed } = await getOnboarding();
  if (completed || step >= TOTAL_STEPS) redirect("/dashboard");

  // アカウント作成（step 0）以外は要ログイン。
  if (step >= 1) {
    const session = await getSession();
    if (!session) redirect("/login");
  }

  const current = ONBOARDING_STEPS[step];

  let body: React.ReactNode = null;
  if (step === 0) {
    body = <AccountStep />;
  } else if (step === 1) {
    const s = await getSettings();
    body = <SalonStep defaultName={s.salonName} />;
  } else if (step === 2) {
    const customerCount = await prisma.customer.count({ where: { deletedAt: null } });
    body = <CustomersStep customerCount={customerCount} />;
  } else if (step === 3) {
    const svc = await listServices();
    body = <MenusStep services={svc.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category }))} />;
  } else {
    body = <AiStep />;
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">初回セットアップ</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">{current.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{current.desc}</p>
      </div>

      {/* ステップ・インジケータ */}
      <ol className="mb-8 flex items-center justify-center gap-2">
        {ONBOARDING_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-200 text-zinc-500"
                }`}
                title={s.title}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < ONBOARDING_STEPS.length - 1 ? (
                <span className={`h-px w-6 ${done ? "bg-emerald-400" : "bg-zinc-200"}`} />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">{body}</div>

      <p className="mt-4 text-center text-xs text-zinc-400">
        ステップ {step + 1} / {TOTAL_STEPS}・すべて完了するとダッシュボードが使えるようになります。
      </p>
    </div>
  );
}
