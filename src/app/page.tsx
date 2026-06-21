import { redirect } from "next/navigation";

// ルートはダッシュボードへ。未認証なら middleware が /login へ誘導する。
export default function Home() {
  redirect("/dashboard");
}
