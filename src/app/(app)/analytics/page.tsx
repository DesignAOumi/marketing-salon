import { redirect } from "next/navigation";

// 分析はダッシュボードに一本化。旧リンク互換のためリダイレクト。
export default function AnalyticsPage() {
  redirect("/dashboard");
}
