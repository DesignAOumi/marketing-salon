import { requireAuth } from "@/lib/auth";
import { logout } from "./actions";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();
  return (
    <AppShell
      session={{ name: session.name, email: session.email, role: session.role }}
      logout={logout}
    >
      {children}
    </AppShell>
  );
}
