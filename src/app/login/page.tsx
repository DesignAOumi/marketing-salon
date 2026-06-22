import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // まだ管理者が居ない（初回）なら、ログインではなくセットアップ・ウィザードへ。
  const owners = await prisma.staff.count({ where: { role: "owner", isActive: true } });
  if (owners === 0) redirect("/setup");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-zinc-900">サロン顧客管理ツール</h1>
        <p className="mb-6 text-sm text-zinc-500">ログインしてください</p>
        <LoginForm />
      </div>
    </main>
  );
}
