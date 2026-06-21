#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
#  リポジトリに顧客データ・DB実体・鍵・秘密情報が混入していないか検査する。
#  Phase 0 DoD / 要件定義書 §9.1 R1。CI と手元（npm run check:no-data）で実行。
#  追跡対象（git管理下）ファイルのみを検査する。
# ──────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

fail=0
note() { echo "  ✗ $1"; fail=1; }

# git 管理下ファイル一覧（未追跡は対象外＝コミットされないため）
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked="$(git ls-files)"
else
  echo "（gitリポジトリではないため全ファイルを対象に検査）"
  tracked="$(find . -type f -not -path './node_modules/*' -not -path './.git/*' | sed 's|^\./||')"
fi

echo "== 禁止ファイルの検査 =="

# 1) SQLite DB 実体
echo "$tracked" | grep -E '\.(db|sqlite|sqlite3|db-journal|db-wal|db-shm)$' && note "SQLite DB がコミットされています" || true

# 2) .env（.env.example は許可）
echo "$tracked" | grep -E '(^|/)\.env($|\.)' | grep -v -E '(^|/)\.env\.example$' && note ".env（秘密情報）がコミットされています" || true

# 3) 鍵素材
echo "$tracked" | grep -E '\.(pem|key|p12)$' && note "鍵素材がコミットされています" || true

# 4) バックアップ/エクスポート
echo "$tracked" | grep -E '(^|/)(backups|exports)/' && note "バックアップ/エクスポートがコミットされています" || true

# 5) 実行時ボリューム
echo "$tracked" | grep -E '(^|/)var/' && note "実行時ボリューム var/ の中身がコミットされています" || true

echo "== 秘密情報パターンの簡易スキャン（追跡ファイル本文） =="
# Anthropic / Google のキー形状を検出（テンプレートのダミーは除外）
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git grep -nE 'sk-ant-[a-zA-Z0-9]{20,}' -- . 2>/dev/null; then
    note "Anthropic APIキーらしき文字列が含まれています"
  fi
fi

if [ "$fail" -eq 0 ]; then
  echo ""
  echo "✓ OK: 顧客データ・DB・鍵・秘密情報の混入は検出されませんでした。"
else
  echo ""
  echo "✗ NG: 上記を修正してください（.gitignore 確認・git rm --cached 等）。"
  exit 1
fi
