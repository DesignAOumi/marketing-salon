import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "サロン顧客管理ツール",
  description:
    "美容サロン向け 顧客データ管理・活用ツール（OSS / セルフホスト / 持ち込みデータ方式）",
};

// スマホ運用（Model A）向け。viewport-fit=cover でセーフエリアを扱えるようにする。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
