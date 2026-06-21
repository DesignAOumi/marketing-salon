# コントリビューションガイド / Contributing

ご協力ありがとうございます！ このプロジェクトは美容サロン向けのセルフホスト型・プライバシーファーストな顧客管理ツールです。

## 🛑 最重要ルール：顧客データを絶対にコミットしない

- `.env`、SQLite DBファイル（`*.db`）、`var/`、バックアップ、エクスポート物は **コミット禁止**（`.gitignore` 済み）。
- 実在の顧客情報・PII を Issue / PR / テストデータに **含めない**。サンプルは必ず架空データを使う（`data/samples/` 参照）。
- 送信前に `npm run check:no-data` で混入チェックできます（CI でも検査します）。

## 開発環境のセットアップ

Node.js 20 以上が必要です。

```bash
npm install
cp .env.example .env          # AUTH_SECRET / ENCRYPTION_KEY を設定（README 参照）
npx prisma migrate dev        # DB(prisma/dev.db)作成 + 初期データ投入
npm run dev                   # http://localhost:3000
```

## 開発コマンド

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバ |
| `npm test` | 単体テスト（vitest・純粋ロジック） |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |
| `npm run lint` | Lint |
| `npm run build` | 本番ビルド |
| `npm run check:no-data` | 顧客データ・鍵の混入検査 |

PR を出す前に **`npm run typecheck && npm run lint && npm test && npm run build`** がすべて通ることを確認してください。

## アーキテクチャの方針

- ドメインロジック（来店サイクル算出・RFM・トリガDSL評価・CSV・ICS）は **純粋関数** として `src/lib/` に置き、テスト可能に保つ（`tests/` に対応する単体テスト）。
- 外部 I/O（DB・Anthropic API・Google API）はサービス層に閉じ込め、UI/ドメインから分離する。
- 機微フィールドは `src/lib/crypto.ts`（AES-256-GCM）で保存時暗号化する。

## PR の流れ

1. このリポジトリを Fork し、フィーチャーブランチを作成（`git checkout -b feature/xxx`）。
2. 変更＋必要なら `tests/` にテストを追加。
3. 上記の検証コマンドが通ることを確認。
4. Pull Request を作成（テンプレートのチェックリストに従う）。

大きな変更や新機能は、事前に Issue で相談いただけると助かります。スコープ・非対応範囲は要件定義書（`docs/要件定義書.md` §4）を参照してください。
