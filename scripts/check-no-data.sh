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

echo "== 秘密情報・PC固有情報のスキャン（追跡ファイル本文） =="
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # 注: 検査スクリプト自身とフックは検出パターン文字列を含むため除外する。
  scan() { # $1=正規表現  $2=メッセージ
    local hits
    hits=$(git grep -nIE "$1" -- . \
      ':(exclude)package-lock.json' ':(exclude)*.lock' \
      ':(exclude).githooks/*' ':(exclude)scripts/check-no-data.sh' 2>/dev/null | head -3 || true)
    if [ -n "$hits" ]; then
      note "$2"
      echo "$hits" | sed 's/^/      /'
    fi
  }
  scan 'sk-ant-[A-Za-z0-9_-]{20,}' 'Anthropic APIキーらしき文字列'
  scan 'GOCSPX-[A-Za-z0-9_-]{10,}' 'Google OAuth クライアントシークレットらしき文字列'
  scan 'AKIA[0-9A-Z]{16}' 'AWS アクセスキーらしき文字列'
  scan 'BEGIN [A-Z ]*PRIVATE KEY' '秘密鍵(PEM)らしき文字列'
  scan '/(Users|home)/[A-Za-z0-9._-]+/' 'PC固有の絶対パス（ホームディレクトリ）'
  scan 'C:\\Users\\[A-Za-z]' 'PC固有の絶対パス（Windows）'
fi

if [ "$fail" -eq 0 ]; then
  echo ""
  echo "✓ OK: 顧客データ・DB・鍵・秘密情報の混入は検出されませんでした。"
else
  echo ""
  echo "✗ NG: 上記を修正してください（.gitignore 確認・git rm --cached 等）。"
  exit 1
fi
