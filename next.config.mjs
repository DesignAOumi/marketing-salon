/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 親ディレクトリの無関係な lockfile を誤検出しないよう、本プロジェクトを root に固定。
  outputFileTracingRoot: import.meta.dirname,
  // 顧客データはローカル完結。テレメトリ無効化（Next.js のビルド時テレメトリも下記 env で停止）。
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
};

export default nextConfig;
