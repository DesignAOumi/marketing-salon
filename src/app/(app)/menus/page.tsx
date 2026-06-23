import { requireAuth } from "@/lib/auth";
import { listServices } from "@/lib/services";
import { listCategories, ensureDefaultCategories } from "@/lib/categories";
import { MenusStep } from "@/components/setup/MenusStep";

export const dynamic = "force-dynamic";

// 初期設定の「区分・メニュー登録」と同じ編集UIを通常画面として提供。
export default async function MenusPage() {
  await requireAuth();
  await ensureDefaultCategories();
  const [svc, cats] = await Promise.all([listServices(), listCategories()]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">メニュー管理</h1>
        <p className="mt-1 text-sm text-zinc-500">区分とメニューの追加・編集・削除ができます。</p>
      </header>

      <MenusStep
        standalone
        services={svc.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          memberPrice: s.memberPrice,
          category: s.category,
          durationMin: s.durationMin,
          defaultCycleDays: s.defaultCycleDays,
        }))}
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
