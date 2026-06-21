import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "サロン顧客管理ツール",
  description:
    "美容サロン向け 顧客データ管理・活用ツール（OSS / セルフホスト / 持ち込みデータ方式）",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
