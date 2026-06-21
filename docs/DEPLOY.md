# デプロイ手順（クラウド・ホスティング） / Deploy

このツールは **Webアプリ** です。クラウドに1サロン分のインスタンスを立てれば、**PCを持たない利用者もスマホ/タブレットのブラウザから利用**できます（モバイル対応済み）。本書は「単一サロンを誰かがホストする」構成（Model A）の手順です。

> ⚠️ **重要（永続ストレージ）**: 顧客データは SQLite ファイル（`/app/var/salon.db`）に保存されます。**ディスクが揮発するホスト（再起動でファイルが消える環境）ではデータが失われます。** 必ず「**永続ボリュームを割り当てる**」か「**マネージド Postgres に切替**（後述）」してください。

---

## 前提

- 独自ドメイン（例 `salon.example.com`）と HTTPS 終端ができること（後述）。
- `APP_URL` を **`https://…`** に設定すること（Secure Cookie が有効化され、スマホ等のLAN外アクセスでもログイン状態が保持されます）。
- 秘密鍵を生成：`openssl rand -base64 48`（AUTH_SECRET）、`openssl rand -hex 32`（ENCRYPTION_KEY）。

---

## 方法1: VPS + docker compose（最も汎用的・推奨の最小構成）

任意の Linux VPS（さくら/ConoHa/Hetzner/Lightsail 等）で、永続ボリュームはホストのディスクをそのまま使えます。

```bash
# 1) Docker をインストール後、リポジトリを取得
git clone https://github.com/DesignAOumi/marketing-salon.git
cd marketing-salon

# 2) .env を作成して設定
cp .env.example .env
#   AUTH_SECRET / ENCRYPTION_KEY を生成して設定
#   ADMIN_EMAIL / ADMIN_PASSWORD を設定（初回ログイン用）
#   APP_URL="https://salon.example.com" に設定（重要）

# 3) 起動（DBは named volume salon-var に永続化）
docker compose up -d --build

# 4) HTTPS 終端（例: Caddy を1枚かませる）
```

### HTTPS（Caddy の例・最小）

`Caddyfile`:
```
salon.example.com {
    reverse_proxy localhost:3000
}
```
Caddy が Let's Encrypt 証明書を自動取得します。Nginx + certbot でも可。

### バックアップ
```bash
docker compose stop app
docker compose cp app:/app/var/salon.db ./salon-backup-$(date +%Y%m%d).db
docker compose start app
```

---

## 方法2: PaaS（Railway / Render / Fly.io 等）

同梱の `Dockerfile` をそのままデプロイできます。**必ず永続ディスク/ボリュームを `/app/var` にマウント**してください。

共通で設定する環境変数:

| 変数 | 値 |
|---|---|
| `DATABASE_URL` | `file:/app/var/salon.db` |
| `AUTH_SECRET` | `openssl rand -base64 48` の出力 |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` の出力 |
| `APP_URL` | `https://<割り当てられた公開URL>` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 初回ログイン用 |

- **Fly.io**: `fly launch`（Dockerfile検出）→ `fly volumes create salon_var -s 1` → `fly.toml` の `[mounts]` で `/app/var` にマウント。HTTPS は自動。
- **Railway**: GitHub 連携でデプロイ → Volume を作成し `/app/var` にマウント → 上記 env を設定。HTTPS は自動。
- **Render**: Web Service（Docker）→ Disk を `/app/var` に追加 → env 設定。HTTPS は自動。

> ヒント: PaaS の無料/最小プランは永続ディスク非対応のことがあります。その場合は方法3（Postgres）にしてください。

---

## 方法3（任意）: マネージド Postgres に切替（ディスク非永続の環境向け・堅牢）

マネージド DB を使うと、コンテナのディスクが揮発してもデータは安全です。

1. `prisma/schema.prisma` の datasource を変更:
   ```prisma
   datasource db {
     provider = "postgresql"   // sqlite から変更
     url      = env("DATABASE_URL")
   }
   ```
2. `DATABASE_URL` をマネージド Postgres の接続文字列に設定（例 `postgresql://user:pass@host:5432/salon`）。
3. Postgres 用マイグレーションを作成:
   ```bash
   rm -rf prisma/migrations   # SQLite用の初期マイグレーションを破棄
   npx prisma migrate dev --name init   # Postgres 用に再生成
   ```
   本番では起動時に `prisma migrate deploy` が走ります（`docker-entrypoint.sh`）。
4. スキーマは SQLite 固有機能を使っていないため、これ以外の変更は不要です（閉集合は String、配列は JSON 文字列）。

> セルフホスト（自分のPCで使う）利用者向けには SQLite のままが最小構成です。Postgres 切替はクラウド配布用の選択肢です。

---

## デプロイ後の確認

1. `https://<公開URL>/api/health` が `{"status":"ok"}` を返す。
2. ブラウザ（スマホ可）で開き、`.env` の `ADMIN_EMAIL` / `ADMIN_PASSWORD` でログイン。
3. 「データ入出力」から `data/samples/customers.sample.csv`（架空）を取り込み動作確認。
4. **初回ログイン後にパスワードを変更**（`.env` の `ADMIN_PASSWORD` を変えて再デプロイ）。

## プライバシー上の注意（Model A）

この構成では **ホスト運用者（あなた）が顧客データを預かる**ことになります（セルフホストの「本人のPCから出ない」モデルとは異なります）。HTTPS・強固な鍵管理・バックアップ・アクセス制御の責任が運用者にあります。詳細は [SECURITY.md](../SECURITY.md) / [PRIVACY.md](PRIVACY.md) を参照してください。
