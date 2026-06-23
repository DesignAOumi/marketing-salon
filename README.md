# 美容サロン顧客管理ツール (Salon CRM)

> セルフホスト型・プライバシーファーストの美容サロン向け顧客データ管理・活用ツール
> Self-hosted, privacy-first customer data management tool for beauty salons.

<!-- バッジ行 / Badges -->
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: WIP](https://img.shields.io/badge/status-WIP-orange.svg)
![Self-hosted](https://img.shields.io/badge/deploy-self--hosted-blue.svg)
![Docker](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Privacy First](https://img.shields.io/badge/privacy-first-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

## 目次 / Table of Contents

- [プロジェクト概要とコンセプト](#プロジェクト概要とコンセプト--overview)
- [主な機能](#主な機能--features)
- [スクリーンショット](#スクリーンショット--screenshots)
- [技術スタック](#技術スタック--tech-stack)
- [クイックスタート](#クイックスタート--quick-start)
- [設定（.env）](#設定env--configuration)
- [AIアドバイスの2モード](#aiアドバイスの2モード--ai-advice-modes)
- [プライバシーとデータの取り扱い](#プライバシーとデータの取り扱い--privacy--data-handling)
- [バックアップ方法](#バックアップ方法--backup)
- [ロードマップ](#ロードマップ--roadmap)
- [コントリビューション](#コントリビューション--contributing)
- [ライセンス](#ライセンス--license)
- [免責事項](#免責事項--disclaimer)

---

## プロジェクト概要とコンセプト / Overview

**Salon CRM** は、個人〜小規模の美容サロン（1〜数名）向けに設計された、顧客データの管理と活用を支援するオープンソースツールです。GitHub で公開され、誰でも自分のサーバーや PC 上に Docker で構築して利用できます。

### 3つのコアコンセプト

| コンセプト | 内容 |
| --- | --- |
| **セルフホスト / Self-hosted** | Docker + docker-compose で、あなた自身のサーバー・PC上に構築。SaaS への登録不要。データはあなたの管理下に。 |
| **持ち込みデータ方式 / Bring Your Own Data** | リポジトリには顧客データを一切含みません。あなたのデータはあなたの環境にのみ存在します。 |
| **プライバシーファースト / Privacy First** | テレメトリなし・外部送信ゼロ（既定）。機微フィールドは保存時に暗号化。個人情報保護法 / GDPR に配慮した設計。 |

このツールの中核は、**来店サイクルに基づく再来店提案（フラッグシップ機能 M6）** です。来店履歴から平均来店間隔を算出し、「そろそろ来店周期の顧客」を自動抽出。ワンクリックで予約案と連絡文を作成し、リピート率の向上を支援します。

> このツールは「顧客データを外に出さずに、データドリブンなサロン運営を実現する」ことを目指しています。

---

## 主な機能 / Features

| モジュール | 機能 | 概要 |
| --- | --- | --- |
| **M1** | 顧客カルテ | 基本情報（連絡先・属性）＋ 施術履歴の記録・管理 |
| **M2** | 売上・購買履歴 | 来店ごとの売上記録、客単価・LTV（顧客生涯価値）の可視化 |
| **M3** | 予約・来店サイクル管理 | 予約と来店履歴の管理、来店間隔の追跡 |
| **M4** | セグメント・分析ダッシュボード | 顧客セグメンテーションと各種指標のダッシュボード表示 |
| **M5** | 予約システム + Googleカレンダー連携 | 予約管理（v1 は一方向同期 + ICS エクスポート。双方向同期は将来対応） |
| **M6 ⭐** | 再来店サイクル提案（フラッグシップ） | 来店周期が近い/超過 かつ 次回予約なし の顧客を自動抽出し、予約案・連絡文を自動生成 |

### ⭐ フラッグシップ機能: M6 再来店サイクル提案

M3 → M4 → AIアドバイス → M5 を束ねる中核導線です。

1. 来店履歴から**平均来店間隔（来店サイクル）**を自動算出
2. **次回予測日が近い／超過**、かつ**先の予約がない**顧客を自動抽出
3. 「**○○様、そろそろ来店周期です。△月△日前後の予約提案を**」とアラート表示
4. **ワンクリック**で予約案の作成・連絡文の生成

### AIアドバイス（2モード）

施術・購買・来店データに基づき、サロン運営のアドバイスを提示します。詳細は [AIアドバイスの2モード](#aiアドバイスの2モード--ai-advice-modes) を参照してください。

- **連携なし（既定 / オフライン）**: 110件の定型アドバイスカタログを顧客データに照合。再来店の連絡文は **LINE向けスタイルガイドに準拠した装飾メッセージ**を組合せで生成（多数のバリエーション）。**外部送信ゼロ・完全プライバシー**。
- **連携あり（BYO APIキー）**: あなたの Claude API キーでパーソナライズされた連絡文を生成（同スタイルガイド準拠・カルテのメモ/嗜好も活用）。送信フィールドは設定で制御可能。キーの稼働状態（正常稼働中／残高不足）を判定し、正常時のみ連携ONにできます。

---

## スクリーンショット / Screenshots

> 🚧 準備中です。以下はプレースホルダです。スクリーンショットが用意でき次第、差し替えてください。

| ダッシュボード | 顧客カルテ |
| --- | --- |
| ![ダッシュボード スクリーンショット](docs/screenshots/dashboard.png) | ![顧客カルテ スクリーンショット](docs/screenshots/customer.png) |

| M6 再来店アラート | AIアドバイス |
| --- | --- |
| ![再来店アラート スクリーンショット](docs/screenshots/recall.png) | ![AIアドバイス スクリーンショット](docs/screenshots/ai-advice.png) |

<!--
スクリーンショットは docs/screenshots/ 配下に配置してください。
推奨サイズ: 横幅 1280px 程度 / PNG または WebP
-->

---

## 技術スタック / Tech Stack

| レイヤー | 採用技術 |
| --- | --- |
| フレームワーク | [Next.js](https://nextjs.org/)（App Router） |
| 言語 | TypeScript |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) |
| グラフ・可視化 | 自作のバーチャート（Tailwind CSS・追加依存なし） |
| ORM | [Prisma](https://www.prisma.io/) |
| データベース | SQLite（既定） / PostgreSQL（任意・将来対応） |
| AI連携 | [Anthropic Claude API](https://www.anthropic.com/)（BYO / 任意。他プロバイダは将来差し替え可） |
| カレンダー連携 | Google Calendar API（一方向同期）/ ICS エクスポート |
| 配布・実行 | Docker / docker-compose |

---

## クイックスタート / Quick Start

最短で動かすには **Docker** を使います（推奨）。Docker を使わない開発手順は [ローカル開発](#ローカル開発contributor-向け) を参照してください。

### 前提条件

- [Docker](https://www.docker.com/) と Docker Compose（v2 以降）
- Git
- `openssl`（秘密鍵の生成に使用。多くの OS に標準同梱）

### セットアップ（Docker・約3分）

```bash
# 1. リポジトリをクローン
git clone https://github.com/<your-account>/salon-crm.git
cd salon-crm

# 2. 環境変数ファイルを作成
cp .env.example .env

# 3. 秘密鍵を2つ生成して .env に設定（必須）
openssl rand -base64 48    # 出力を .env の AUTH_SECRET に貼り付け（セッション署名鍵）
openssl rand -hex 32       # 出力を .env の ENCRYPTION_KEY に貼り付け（暗号化鍵・32バイト）

# 4. 起動（初回はビルドのため数分）
docker compose up -d --build

# 5. 動作確認（200 OK と {"status":"ok"} が返れば成功）
curl http://localhost:3000/api/health
```

**起動時に自動で行われること**: DBスキーマの適用（`prisma migrate deploy`）→ サロン設定の初期化。管理者アカウントは初回アクセス時に画面で作成します。手動の初期化コマンドは不要です。

### 初回セットアップ（ウィザード）

ブラウザで **http://localhost:3000** を開くと、初回は**セットアップ・ウィザード**が起動します。次の順に進め、すべて完了するとダッシュボードが使えるようになります。

1. **アカウント作成**（管理者）
2. **サロン情報**（サロン名・連絡先・通貨など）
3. **顧客データ**（「サンプルを取り込む」ボタン、またはCSV取り込み）
4. **区分・メニュー登録**（区分マスタ＋メニューを追加・編集）
5. **登録内容の確認**
6. **AI連携**（既定はオフライン／任意でClaude APIキー）

> セットアップ後も、ナビの **「メニュー管理」** から区分・メニューをいつでも編集できます。アプリ上部のタイトルは、登録したサロン名を使って **「{サロン名}-マーケ管理最適化ツール」** と表示されます（設定でサロン名を変えると追従）。

> 自動化したい場合のみ、`.env` に `ADMIN_EMAIL` / `ADMIN_PASSWORD` を設定すると起動時に管理者を作成し、アカウント作成ステップをスキップできます（任意）。
>
> 🔐 **本番運用ではパスワードを十分に強固なものに**してください。

> 📦 顧客データは Docker の named volume `salon-var`（コンテナ内 `/app/var/salon.db`）にのみ保存され、リポジトリには一切含まれません。

> ☁️ **PCを持たない人にもスマホから使ってもらいたい場合** は、クラウドに1サロン分をホストできます（モバイル対応済み）。手順は [docs/DEPLOY.md](docs/DEPLOY.md)（VPS+docker compose / Railway / Render / Fly.io / Postgres切替）。

### ローカル開発（contributor 向け）

Docker を使わずに開発する場合（Node.js 20 以上が必要）:

```bash
npm install
cp .env.example .env          # AUTH_SECRET / ENCRYPTION_KEY を上記と同様に設定
npx prisma migrate dev        # DB(prisma/dev.db)を作成し初期データを投入
npm run dev                   # http://localhost:3000 で開発サーバ起動
```

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバ起動 |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |
| `npm run lint` | Lint |
| `npm test` | 単体テスト（vitest・純粋ロジック） |
| `npm run db:seed` | 初期データ再投入（冪等） |
| `npm run check:no-data` | 顧客データ・鍵の混入検査（CI と同等） |

> 🧪 **お試し用サンプルデータ**: 架空の顧客データ [`data/samples/customers.sample.csv`](data/samples/customers.sample.csv) を「データ入出力」画面からインポートすると、すぐに動作を確認できます（来店・売上は手入力で追加すると来店サイクルや再来店提案が動きます）。

---

## 設定（.env）/ Configuration

`.env.example` をコピーして `.env` を作成し、以下を設定します。

| 変数名 | 必須 | 既定値（`.env.example`） | 説明 |
| --- | :---: | --- | --- |
| `AUTH_SECRET` | ✅ | （要生成） | セッション JWT の署名鍵。`openssl rand -base64 48` で生成 |
| `ENCRYPTION_KEY` | ✅ | （要生成） | 機微フィールド（APIキー等）の AES-256-GCM 暗号鍵。**32バイト**＝`openssl rand -hex 32`（hex64桁）または base64 |
| `DATABASE_URL` | ✅ | `file:./dev.db`（ローカル） | DB接続文字列。**Docker 起動時は `file:/app/var/salon.db` に自動上書き**。SQLite 既定、将来 PostgreSQL 可 |
| `APP_URL` | ✅ | `http://localhost:3000` | 公開URL。**`https://` の場合のみ Secure Cookie を有効化**。localhost / LAN の HTTP 利用は `http://` のままにする（https にすると Cookie が破棄されログインできません） |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | – | （空） | 初回起動時に作成する管理者アカウント。設定すると起動時シードが自動作成/更新（冪等） |
| `ADMIN_NAME` / `SALON_NAME` | – | `管理者` / `My Salon` | 管理者の表示名 / サロン名 |
| `ANTHROPIC_API_KEY` | – | （空） | **任意**。AI「連携あり」モード用。アプリの設定画面からも登録可（保存時暗号化） |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | – | （空） | **任意**。Googleカレンダー連携の実OAuth用（現状はボタンUI・設定導線のみで、実同期は未実装） |

> AIモデル・タイムゾーン・通貨・送信フィールド・背景テーマカラーなどの運用設定は、環境変数ではなく**アプリの「設定」画面（DBに保存）**で管理します。
>
> ⚠️ `.env`・DBファイル（`*.db`）・`var/` は **`.gitignore` で除外**済みです。リポジトリにコミットしないでください（CI でも `npm run check:no-data` により混入を検査します）。

---

## AIアドバイスの2モード / AI Advice Modes

本ツールの AIアドバイス機能は、**プライバシーを最優先**して 2 つのモードを用意しています。

### 🔒 モード1: 連携なし（既定 / オフライン）

- **110 件の定型アドバイスカタログ**を内蔵。各アドバイスには「トリガ条件」が設定されています。
- 顧客データを**ローカルで照合**し、条件に合致したアドバイスを提示します。
- **外部送信は一切ありません。完全プライバシー。** API キーも不要です。
- 例: 「最終来店から平均サイクルの1.5倍が経過 → 再来店フォローを推奨」

### 🤖 モード2: 連携あり（BYO APIキー）

- あなた自身の **Claude API キー（Bring Your Own Key）** を使い、パーソナライズされたアドバイスを生成します。
- **送信されるフィールドは設定画面で制御可能**（PII最小化 / 匿名化オプション）。氏名や連絡先など機微な情報を除外して送信できます。
- 既定モデルは Claude。将来的に他プロバイダへの差し替えにも対応予定です。

#### APIキーの設定方法

1. [Anthropic Console](https://console.anthropic.com/) で API キーを取得します。
2. 以下のいずれかの方法でキーを設定します。
   - **`.env` に設定**: `ANTHROPIC_API_KEY=sk-ant-...` を記入して再起動。
   - **設定画面から入力**: アプリの「設定 → AI連携」画面で入力（保存時に `ENCRYPTION_KEY` で暗号化されます）。
3. 設定画面で AIアドバイスモードを **「連携あり」** に切り替えます。
4. 送信フィールド設定で、**送信を許可する項目**（および匿名化の有無）を確認・調整します。

> 💡 API の利用料金は **あなたの Anthropic アカウント**に課金されます。料金体系は Anthropic の公式情報をご確認ください。

---

## プライバシーとデータの取り扱い / Privacy & Data Handling

> **🛡️ 重要: 顧客データはあなたの環境（サーバー / PC）内にのみ保存されます。**

本ツールはプライバシーを設計の中心に据えています。

- **データの所在**: すべての顧客データは、あなたがホストする環境内のデータベース（既定: SQLite）にのみ保存されます。開発元を含む第三者がアクセスすることはありません。
- **テレメトリなし**: 利用状況の収集・送信は一切行いません。
- **外部送信ゼロ（既定）**: AIアドバイスの「連携なし」モードでは、データが外部に送信されることはありません。「連携あり」モードを**明示的に有効化**した場合のみ、設定で許可したフィールドが Anthropic API に送信されます。
- **保存時暗号化**: API キー・機微フィールドは `ENCRYPTION_KEY` を用いて AES-256-GCM で保存時に暗号化されます。
- **リポジトリにデータ非格納**: `.env`・データベースファイル・エクスポート物は `.gitignore` で徹底的に除外しています。
- **エクスポート / ポータビリティ**: 顧客データは CSV / JSON 形式でエクスポートできます。
- **個人情報保護法 / GDPR への配慮**: 顧客本人からの**開示・削除（忘れられる権利）・同意管理**に対応する機能を備えます。

> ⚠️ セルフホストの性質上、**データの保護・バックアップ・適切なアクセス管理の責任は運用者（あなた）にあります。** 公開ネットワークに設置する場合は、HTTPS 化（リバースプロキシで終端し `APP_URL` を `https://` に設定）・強固な `AUTH_SECRET` / `ENCRYPTION_KEY`・適切なファイアウォール設定を必ず行ってください。

---

## バックアップ方法 / Backup

データはあなたの環境にのみ存在するため、**定期的なバックアップを強く推奨**します。

### SQLite（既定）の場合

顧客データは named volume `salon-var`（コンテナ内 `/app/var/salon.db`）に保存されます。DBファイルをコピーするだけでバックアップできます。

```bash
mkdir -p backup
# 整合性のため、可能ならアプリを停止してから取得する
docker compose stop app
docker compose cp app:/app/var/salon.db ./backup/salon-$(date +%Y%m%d).db
docker compose start app
```

### アプリ内エクスポート

**「データ入出力」画面**から、顧客・売上・予約・分析の各データを **CSV / JSON** で書き出せます（データ種別ごとにエリア分割）。インポートは顧客データに対応し、`id` 一致で更新／無ければ新規作成します。

### リストア

```bash
docker compose stop app
docker compose cp ./backup/salon-YYYYMMDD.db app:/app/var/salon.db
docker compose start app
```

> 💡 バックアップは**別の物理媒体・別の場所**にも保管することを推奨します（3-2-1 ルール）。

---

## ロードマップ / Roadmap

> **現在の状況**: MVP（Phase 0〜3）＋ 設定/連携ありAI/ICS（Phase 4）＋ OSS整備（Phase 5）を完了。さらに **初回セットアップ・ウィザード／メニュー・区分管理／分析のダッシュボード一本化／背景テーマカラー／LINE向け装飾連絡文／顧客の多条件フィルタ・次回予約列／モバイル対応・クラウドデプロイ手順／誤コミット防止フック** を実装済み。残るは Googleカレンダー連携の実OAuth・スクリーンショット・v1.0 タグ付け。

- [x] **Phase 0** 雛形・Docker・DBスキーマ・簡易認証の枠（単一テナント）
- [x] **M1** 顧客カルテ（基本情報・施術履歴・検索・連絡先暗号化・アレルギー警告）
- [x] **M2** 売上・購買履歴（会計明細・客単価・LTV・店販比率）
- [x] CSV / JSON インポート・エクスポート（持ち込みデータ方式・往復整合）
- [x] **M3** 予約・来店サイクル管理（平均来店間隔=中央値・次回予測日・サイクル状態）
- [x] **M4** セグメント・分析ダッシュボード（RFM・セグメント分布・上位顧客・KPI）
- [x] **M6 ⭐** 再来店サイクル提案（フラッグシップ・自動抽出 → 連絡文 → ワンクリック予約案）
- [x] AIアドバイス: 連携なし（定型カタログ110件・トリガDSL評価エンジン・外部送信ゼロ）
- [x] **M0 設定**（サロン情報・AIモード・モデル選択・APIキー暗号化保存・送信フィールド制御・接続テスト）
- [x] AIアドバイス: 連携あり（Claude BYO・送信フィールド制御・氏名匿名化・連携なしフォールバック）
- [x] **M5** ICS エクスポート（顧客名の有無を制御可能・GCal連携なしでも利用可）
- [x] **Phase 5** OSS整備（LICENSE(MIT)・CONTRIBUTING・SECURITY・PRIVACY・サンプルデータ・vitest テスト・CI）
- [x] **初回セットアップ・ウィザード**（アカウント作成→サロン情報→顧客データ→区分・メニュー→確認→AI連携の順次ゲート）
- [x] **メニュー・区分管理**（区分マスタ・会員価格・税込・アコーディオン編集／「メニュー管理」画面）
- [x] **ダッシュボード一本化**（KPI＋分析(M4)を統合・/analytics は /dashboard へ）
- [x] **背景テーマカラー**（8プリセット・ヘッダー連動）
- [x] **LINE向け装飾連絡文**（[sns-message-style-guide](https://github.com/DesignAOumi/sns-message-style-guide) 準拠・組合せ生成・「再提案」対応）
- [x] **顧客の多条件フィルタ／状態フィルタ／次回予約・推奨日時の表示**
- [x] **モバイル対応シェル ＋ クラウドデプロイ手順**（[docs/DEPLOY.md](docs/DEPLOY.md)・Model A）
- [x] **誤コミット防止フック**（pre-commit/pre-push・CI で秘密/データ混入検査）
- [ ] **M5** Googleカレンダー連携（ボタンUI・設定導線は設置済み／実OAuthは要 Google 認証情報で未実装）
- [ ] **Phase 5** スクリーンショット・v1.0 リリースタグ
- [ ] **将来**: Googleカレンダー双方向同期
- [ ] **将来**: 他AIプロバイダ対応
- [ ] **将来**: PostgreSQL 正式対応 / マルチユーザー権限の拡張
- [ ] **将来**: 多言語対応（i18n）

> ロードマップは変更される可能性があります。最新の状況は Issues / Projects をご確認ください。

---

## コントリビューション / Contributing

コントリビューションを歓迎します！ 🎉

1. このリポジトリを **Fork** します。
2. フィーチャーブランチを作成します（`git checkout -b feature/your-feature`）。
3. 変更をコミットします（`git commit -m 'Add some feature'`）。
4. ブランチを Push します（`git push origin feature/your-feature`）。
5. **Pull Request** を作成します。

### 開発の流れ

- バグ報告・機能提案は [Issues](../../issues) からお願いします（テンプレートあり）。
- 開発環境・テスト方針・PR の流れは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。
- 脆弱性の報告・セキュリティ設計は [SECURITY.md](SECURITY.md) を参照してください。
- データの取り扱い・プライバシー方針は [docs/PRIVACY.md](docs/PRIVACY.md) にまとめています。

> ⚠️ **顧客データ・`.env`・実データを含む変更は絶対にコミットしないでください。** `npm run check:no-data` で検査でき、CI でも自動チェックします。

---

## ライセンス / License

**MIT License** で公開しています。全文は [LICENSE](LICENSE) を参照してください。誰でも自由に利用・改変・再配布できます（無保証）。

---

## 免責事項 / Disclaimer

- 本ソフトウェアは **「現状有姿（AS IS）」** で提供され、いかなる保証も行いません。本ソフトウェアの利用により生じた、いかなる損害（データ損失・情報漏洩・営業損失等を含む）についても、開発者・コントリビューターは責任を負いません。
- **データの保護・バックアップ・法令遵守の責任は、運用者（利用者）にあります。** 個人情報保護法・GDPR 等、適用される法令の遵守は利用者の責任で行ってください。
- AIアドバイス機能（連携あり）の利用にあたっては、Anthropic 等の各サービスの利用規約・プライバシーポリシーに従ってください。API 利用料金は利用者の負担となります。
- 本ツールが提示するアドバイス・予測（来店サイクル等）は参考情報であり、その正確性・有効性を保証するものではありません。最終的な経営判断は利用者ご自身の責任で行ってください。

---

<p align="center">
  Made with ❤️ for small salons — <strong>Your data stays yours.</strong>
</p>
