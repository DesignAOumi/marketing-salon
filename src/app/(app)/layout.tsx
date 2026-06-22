import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOnboarding } from "@/lib/onboarding";
import { logout } from "./actions";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();
  // セットアップ未完了の間はダッシュボード等をロックし、ウィザードへ誘導。
  const { completed } = await getOnboarding();
  if (!completed) redirect("/setup");
  return (
    <AppShell
      session={{ name: session.name, email: session.email, role: session.role }}
      logout={logout}
    >
      {children}
    </AppShell>
  );
}
