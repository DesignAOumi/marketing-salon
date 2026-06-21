#!/bin/sh
set -e

# 0) DB ディレクトリの書込可否を最初に検査（バインドマウント権限ミスを明確に失敗させる）。
if ! ( : > /app/var/.wtest ) 2>/dev/null; then
  echo "[entrypoint] FATAL: /app/var に書き込めません（uid=$(id -u)）。" >&2
  echo "[entrypoint]   named volume 利用時は通常発生しません。バインドマウント時は" >&2
  echo "[entrypoint]   host 側ディレクトリの所有者を 1001:1001 に揃えてください（例: sudo chown -R 1001:1001 var）。" >&2
  exit 1
fi
rm -f /app/var/.wtest

# 1) DB スキーマ適用（M0-2）。
echo "[entrypoint] applying migrations (prisma migrate deploy)…"
npx prisma migrate deploy

# 2) 初期シード（冪等：Settings シングルトン / 任意の管理者）。
#    失敗は致命扱いにする（owner 未作成のままサイレント起動＝ログイン不能を防ぐ）。
#    seed は冪等で restart: unless-stopped のため、恒久障害時のみ再試行になる。
echo "[entrypoint] seeding (idempotent)…"
node prisma/seed.cjs

echo "[entrypoint] starting app: $*"
exec "$@"
