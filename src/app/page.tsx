import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOnboarding } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

// 初回（管理者未作成）またはセットアップ未完了なら /setup、完了済みなら /dashboard。
export default async function Home() {
  const owners = await prisma.staff.count({ where: { role: "owner", isActive: true } });
  if (owners === 0) redirect("/setup");
  const { completed } = await getOnboarding();
  redirect(completed ? "/dashboard" : "/setup");
}
