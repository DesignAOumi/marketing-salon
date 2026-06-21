# セキュリティポリシー / Security Policy

## 脆弱性の報告

セキュリティ上の問題を見つけた場合は、**公開 Issue を立てずに** GitHub の「Security Advisories（プライベート報告）」機能、またはメンテナへ非公開でご連絡ください。再現手順・影響範囲・想定される深刻度を添えていただけると助かります。可能な範囲で迅速に対応します。

## セキュリティ設計の前提

本ツールはセルフホスト・持ち込みデータ方式であり、**データ管理の責任は運用者（利用者）に帰属**します。設計上の保護:

- **データはローカル完結**: 顧客データは利用者のサーバー/PC（SQLite + 永続ボリューム）にのみ保存。テレメトリ・外部送信なし。
- **保存時暗号化**: APIキー等の機微フィールドは `ENCRYPTION_KEY` を用いて AES-256-GCM で暗号化（`src/lib/crypto.ts`）。
- **認証**: 全画面・全APIをログイン必須でガード（middleware）。パスワードは bcrypt でハッシュ化。セッションは HttpOnly Cookie + 署名付き JWT（`AUTH_SECRET`）。
- **外部送信の既定OFF**: AIアドバイスの既定はオフライン（外部送信ゼロ）。連携あり（Claude BYO）は明示オプトイン時のみ、ホワイトリストのフィールドだけを送信（PII既定OFF・氏名匿名化）。
- **データ非格納**: `.env`・DBファイル・鍵はリポジトリに含めない（`.gitignore` + CI 検査 `scripts/check-no-data.sh`）。

## 運用者へのお願い（自己ホストの責任範囲）

- `AUTH_SECRET` / `ENCRYPTION_KEY` を十分に強いランダム値にし、安全に保管する（漏洩時はローテーション）。
- 公開ネットワークに設置する場合はリバースプロキシで **HTTPS 終端**し、`APP_URL` を `https://` に設定する（Secure Cookie 有効化）。
- DBファイル（顧客データ）と鍵のバックアップ・アクセス管理を適切に行う。

## コミット/プッシュ保護ルール（自動ガード）

実装・テスト中に **PC固有情報や秘密情報を誤ってコミット/プッシュしないよう、仕組みで防止**しています。注意力に頼らず多層で守ります。

**絶対にコミットしないもの**
- 秘密情報: `.env`、APIキー（Anthropic `sk-ant-…`、Google `GOCSPX-…`）、AWS キー、秘密鍵（PEM）、OAuth トークン
- 顧客データ: SQLite DB 実体（`*.db`）、`var/`（実行時ボリューム）、`backups/`・`exports/`（バックアップ/エクスポート）
- PC固有情報: 絶対ホームパス（`/Users/<名前>/`、`/home/<名前>/`、`C:\Users\…`）、個人名・個人メール等
- 他ユーザーの情報・第三者の機微情報

**多層の防御**
1. **`.gitignore`** — `.env`・`*.db`・`var/`・鍵・バックアップ/エクスポートを除外（`.env.example` のみ許可）。
2. **pre-commit フック**（`.githooks/pre-commit`）— ステージされた変更に上記の禁止ファイル・秘密パターン・PC固有パスが無いか検査し、見つかればコミットを**中止**。
3. **pre-push フック**（`.githooks/pre-push`）— プッシュ前に追跡ファイル全体を `scripts/check-no-data.sh` で最終検査。
4. **CI**（`.github/workflows/ci.yml`）— `no-data-committed` ジョブが同検査を実行。

**有効化**（クローン後の初回のみ。`npm install` 実行時に自動設定されます）
```bash
npm run setup:hooks   # git config core.hooksPath .githooks
npm run check:no-data # 手動でいつでも検査可能
```

**誤検知で意図的に通したい場合のみ** `git commit --no-verify` / `git push --no-verify`（多用しないこと）。

> 実テスト時は本物のAPIキー等を `.env` に入れますが、`.env` は `.gitignore` 済みかつフックでも二重にブロックされます。スクリーンショットを README 等に載せる際も、実在の顧客名・連絡先が写らないよう架空データ（`data/samples/`）を使ってください。

## 対象バージョン

最新リリースのみをサポート対象とします（v1 系）。
