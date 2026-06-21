# データモデル定義

本書は、美容サロン向け顧客データ管理・活用ツール（OSS / セルフホスト）のデータモデルを定義する補助文書である。要件定義書（プロダクト前提）に紐づき、Prisma + SQLite を既定とした実装の土台となる。

- 凡例
  - **(PII)**: 個人情報・要配慮情報を含むフィールド。取り扱い・暗号化・エクスポート時のマスキング対象。
  - **必須**: スキーマ上 NOT NULL（あるいはアプリ層で入力必須）であるものを「○」、任意を「-」とする。
  - 派生指標（`daysSinceLastVisit`, `avgVisitIntervalDays` など）は、原則として永続化せず算出する「導出値」だが、ダッシュボード/M6アラートの性能要件上、一部はバッチ更新でキャッシュ列として保持する（後述）。
  - 日時は ISO 8601 / UTC 保存、表示時にサロンのタイムゾーンへ変換する。
  - 通貨は最小単位（円）を `Int` で保持し小数誤差を避ける。

---

## 1. エンティティ一覧（概要）

| エンティティ | 役割 | 主なPII |
|---|---|---|
| `Customer` | 顧客マスタ。カルテ基本情報の中核 | 氏名・連絡先・生年月日・カルテ自由記述 |
| `Visit` | 来店＝施術履歴。1来店1レコード | 施術メモ |
| `Service` | メニューマスタ（施術メニュー定義） | なし |
| `Sale` | 会計（伝票ヘッダ）。1会計1レコード | なし（顧客参照経由でPIIに連結） |
| `SaleItem` | 会計明細。Sale内の1品目 | なし |
| `Product` | 店販商品マスタ | なし |
| `Reservation` | 予約。将来来店の予定 | 予約メモ |
| `AdviceLog` | アドバイス発火履歴（カタログ/AI両モード） | 生成テキストに顧客文脈を含み得る |
| `Staff` | スタッフ（担当者）マスタ兼ログインユーザー | 氏名・メール |
| `Settings` | サロン情報 / AI設定 / 暗号化APIキー（単一行） | サロン連絡先・APIキー |

---

## 2. エンティティ詳細

### 2.1 Customer（顧客）

顧客カルテの中核。基本情報・カルテ・来店サイクル・売上の派生指標を集約する。

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。`customerId`。 |
| `name` | String | ○ | 氏名 **(PII)**。 |
| `nameKana` | String | - | フリガナ **(PII)**。検索・並び替え用。 |
| `birthday` | DateTime | - | 生年月日 **(PII)**。`daysToBirthday` 算出元。 |
| `gender` | Enum(`male`/`female`/`other`/`unknown`) | - | 性別 **(PII)**。 |
| `phone` | String | - | 電話番号 **(PII)**。保存時暗号化推奨。 |
| `email` | String | - | メールアドレス **(PII)**。保存時暗号化推奨。 |
| `registeredAt` | DateTime | ○ | 顧客登録日。既定=現在時刻。 |
| `status` | Enum(`new`/`repeat`/`dormant`) | ○ | 顧客状態。来店実績から自動更新。 |
| `preferredStaffId` | String? (FK→Staff) | - | 希望担当スタッフ。 |
| `consentToContact` | Boolean | ○ | 連絡同意フラグ。既定=false。連絡文・DM対象判定の必須ゲート。 |
| `hairType` | String | - | 髪質 **(PII: 要配慮に準ずる)**。 |
| `skinType` | String | - | 肌質 **(PII: 要配慮に準ずる)**。 |
| `allergies` | String (JSON配列) | - | アレルギー情報 `allergies[]` **(PII: 要配慮)**。SQLite制約により文字列JSONで保持。 |
| `preferences` | String | - | 嗜好（自由記述）**(PII)**。 |
| `notes` | String | - | カルテ備考（自由記述）**(PII)**。 |
| `firstVisitDate` | DateTime | - | 初回来店日。Visit集計のキャッシュ列。 |
| `lastVisitDate` | DateTime | - | 最終来店日。Visit集計のキャッシュ列。 |
| `visitCount` | Int | ○ | 累計来店回数。既定=0。キャッシュ列。 |
| `avgVisitIntervalDays` | Float | - | 平均来店間隔（日）。キャッシュ列（派生指標 §4）。 |
| `nextPredictedVisitDate` | DateTime | - | 次回予測来店日。キャッシュ列（派生指標 §4）。 |
| `totalSales` | Int | ○ | 累計売上（円）。既定=0。キャッシュ列。 |
| `lastSaleAmount` | Int | - | 直近会計金額（円）。 |
| `retailPurchaseCount` | Int | ○ | 店販購入回数。既定=0。キャッシュ列。 |
| `rfmSegment` | String | - | RFMセグメントラベル（派生指標 §4）。 |
| `anniversaryDate` | DateTime | - | 記念日（初来店記念日等）。既定は`firstVisitDate`。 |
| `lastContactDate` | DateTime | - | 最終連絡日。エンゲージ指標。 |
| `reviewGiven` | Boolean | ○ | レビュー投稿有無。既定=false。 |
| `referralCount` | Int | ○ | 紹介人数。既定=0。 |
| `createdAt` | DateTime | ○ | レコード作成日時。 |
| `updatedAt` | DateTime | ○ | 更新日時。 |
| `deletedAt` | DateTime? | - | 論理削除日時。GDPR/個情法の削除要求に対応（物理削除APIも別途提供）。 |

> 注: `daysSinceLastVisit`, `cycleOverdueRatio`, `avgSpend`, `ltv`, `retailRatio`, `rfmRecency/Frequency/Monetary`, `daysToBirthday`, `daysToAnniversary`, `hasUpcomingReservation`, `nextReservationDate`, `lastService` は**列として保持せず**、クエリ/サービス層で算出する導出値（§4）。`avgVisitIntervalDays`・`nextPredictedVisitDate`・`rfmSegment` 等はM6/ダッシュボード性能のため夜間バッチでキャッシュ更新する。

### 2.2 Visit（来店 / 施術履歴）

`serviceHistory[]` の各要素に相当。1来店＝1レコード。会計（Sale）と1対1〜1対0で対応する。

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `customerId` | String (FK→Customer) | ○ | 来店した顧客。 |
| `date` | DateTime | ○ | 来店日時。`avgVisitIntervalDays` 算出元。 |
| `staffId` | String? (FK→Staff) | - | 担当スタッフ。 |
| `menu` | String | - | 施術メニュー名（スナップショット）。 |
| `serviceId` | String? (FK→Service) | - | メニューマスタ参照。 |
| `products` | String (JSON配列) | - | 当日提案/使用した店販等のメモ。 |
| `memo` | String | - | 施術メモ（自由記述）**(PII)**。 |
| `saleId` | String? (FK→Sale) | - | 対応する会計。 |
| `createdAt` | DateTime | ○ | 作成日時。 |

### 2.3 Service（メニューマスタ）

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `name` | String | ○ | メニュー名（例: カット、カラー）。 |
| `category` | String | - | カテゴリ（cut/color/perm/spa 等）。 |
| `price` | Int | ○ | 標準価格（円）。 |
| `durationMin` | Int | - | 標準施術時間（分）。予約枠算出に利用。 |
| `defaultCycleDays` | Int | - | 推奨来店周期（日）。来店履歴が乏しい新規顧客のM6予測フォールバック。 |
| `isActive` | Boolean | ○ | 提供中フラグ。既定=true。 |
| `createdAt` | DateTime | ○ | 作成日時。 |
| `updatedAt` | DateTime | ○ | 更新日時。 |

### 2.4 Sale（会計 / 伝票ヘッダ）

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `customerId` | String (FK→Customer) | ○ | 会計対象の顧客。 |
| `visitId` | String? (FK→Visit) | - | 対応する来店。 |
| `date` | DateTime | ○ | 会計日時。 |
| `totalAmount` | Int | ○ | 合計金額（円、税込）。`totalAmount = Σ SaleItem.amount − discountAmount`。 |
| `discountAmount` | Int | - | 伝票全体の割引額（円）。既定=0。会計レベル割引の**正本**（FR-M2-03 と対応）。 |
| `taxAmount` | Int | - | 消費税額（円）。 |
| `paymentMethod` | Enum(`cash`/`card`/`emoney`/`other`) | - | 支払方法。 |
| `staffId` | String? (FK→Staff) | - | 担当/レジ担当。 |
| `createdAt` | DateTime | ○ | 作成日時。 |

### 2.5 SaleItem（会計明細）

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `saleId` | String (FK→Sale) | ○ | 親会計。 |
| `itemType` | Enum(`service`/`product`) | ○ | 施術 or 店販。`retailPurchaseCount`/`retailRatio` の判定軸。 |
| `serviceId` | String? (FK→Service) | - | 施術明細のメニュー参照。 |
| `productId` | String? (FK→Product) | - | 店販明細の商品参照。 |
| `name` | String | ○ | 品目名スナップショット（マスタ削除耐性のため保持）。 |
| `unitPrice` | Int | ○ | 単価（円）。 |
| `quantity` | Int | ○ | 数量。既定=1。 |
| `lineDiscount` | Int | - | 明細単位の割引額（円）。既定=0。 |
| `amount` | Int | ○ | 小計（円）= `unitPrice * quantity − lineDiscount`。明細割引のみ反映。伝票全体割引は `Sale.discountAmount` で別管理。 |

### 2.6 Product（店販商品マスタ）

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `name` | String | ○ | 商品名。 |
| `category` | String | - | カテゴリ（shampoo/treatment/styling 等）。 |
| `price` | Int | ○ | 標準価格（円）。 |
| `sku` | String? | - | SKU / 型番。 |
| `isActive` | Boolean | ○ | 取扱中フラグ。既定=true。 |
| `createdAt` | DateTime | ○ | 作成日時。 |
| `updatedAt` | DateTime | ○ | 更新日時。 |

### 2.7 Reservation（予約）

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `customerId` | String (FK→Customer) | ○ | 予約者。`hasUpcomingReservation`/`nextReservationDate` の算出元。 |
| `startAt` | DateTime | ○ | 予約開始日時。 |
| `endAt` | DateTime | - | 予約終了日時（`Service.durationMin`から補完可）。 |
| `serviceId` | String? (FK→Service) | - | 予約メニュー。 |
| `staffId` | String? (FK→Staff) | - | 指名/担当スタッフ。 |
| `status` | Enum(`booked`/`done`/`cancelled`/`noshow`) | ○ | 予約状態。既定=`booked`。 |
| `source` | Enum(`manual`/`m6_suggestion`/`import`) | ○ | 作成元。M6ワンクリック予約案は`m6_suggestion`。 |
| `googleEventId` | String? | - | Googleカレンダー連携の対応イベントID（M5一方向同期/ICS）。 |
| `memo` | String | - | 予約メモ（自由記述）**(PII)**。 |
| `createdAt` | DateTime | ○ | 作成日時。 |
| `updatedAt` | DateTime | ○ | 更新日時。 |

### 2.8 AdviceLog（アドバイス発火履歴）

カタログ照合（連携なし）/ AI生成（連携あり）の両モードの提示履歴。重複提示の抑制・効果測定・監査に用いる。

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `customerId` | String? (FK→Customer) | - | 対象顧客（全体向けはnull）。 |
| `mode` | Enum(`catalog`/`ai`) | ○ | 発火モード。 |
| `adviceKey` | String | - | カタログアドバイスID（catalog時）。 |
| `triggerSnapshot` | String (JSON) | - | 発火時に評価した派生指標のスナップショット（監査用）。 |
| `message` | String | ○ | 提示文。AI生成時は顧客文脈を含み得る **(PII相当)**。 |
| `model` | String? | - | AI生成時のモデル名（例: claude-*）。 |
| `status` | Enum(`shown`/`accepted`/`dismissed`/`acted`) | ○ | 提示後の状態。効果測定用。既定=`shown`。 |
| `createdAt` | DateTime | ○ | 発火日時。 |

> AIモードでは外部送信フィールドが設定で制御される（PII最小化/匿名化）。`triggerSnapshot`・`message`は顧客文脈を含むためエクスポート時のマスキング対象。

### 2.9 Staff（スタッフ / ユーザー）

担当者マスタ兼ログインユーザー（単一テナント・ロール最小）。

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String (cuid) | ○ | 主キー。 |
| `name` | String | ○ | 氏名 **(PII)**。 |
| `email` | String? | - | ログイン用メール **(PII)**。一意。 |
| `passwordHash` | String? | - | パスワードハッシュ（argon2/bcrypt）。平文不可。 |
| `role` | Enum(`owner`/`staff`) | ○ | ロール。最小権限。既定=`staff`。 |
| `isActive` | Boolean | ○ | 在籍フラグ。既定=true。 |
| `createdAt` | DateTime | ○ | 作成日時。 |
| `updatedAt` | DateTime | ○ | 更新日時。 |

### 2.10 Settings（サロン情報 / AI設定 / 暗号化APIキー）

単一テナントのため原則1行（`id` は固定キー or シングルトン）。

| フィールド名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | String | ○ | 主キー（固定値 `"singleton"`）。 |
| `salonName` | String | ○ | サロン名。 |
| `salonPhone` | String? | - | サロン電話番号 **(PII)**。 |
| `salonEmail` | String? | - | サロンメール **(PII)**。 |
| `timezone` | String | ○ | タイムゾーン。既定=`Asia/Tokyo`。 |
| `currency` | String | ○ | 通貨。既定=`JPY`。 |
| `aiMode` | Enum(`offline`/`connected`) | ○ | AIモード。既定=`offline`（外部送信ゼロ）。 |
| `aiProvider` | String | - | プロバイダ識別子。既定=`claude`。将来差し替え可。 |
| `aiModel` | String | - | 既定モデル名。 |
| `encryptedApiKey` | String? | - | BYO APIキー（**保存時暗号化**, AES-256-GCM）**(PII/機微)**。平文保存禁止。 |
| `apiKeyIv` | String? | - | 暗号化IV/nonce。 |
| `aiSharedFields` | String (JSON配列) | - | AI送信を許可するフィールド集合（PII最小化/匿名化制御）。 |
| `anonymizeBeforeSend` | Boolean | ○ | 送信前匿名化フラグ。既定=true。 |
| `createdAt` | DateTime | ○ | 作成日時。 |
| `updatedAt` | DateTime | ○ | 更新日時。 |

---

## 3. リレーション

### 3.1 リレーション一覧

| 親 | 子 | 多重度 | 説明 |
|---|---|---|---|
| Customer | Visit | 1 : N | 1顧客は複数来店を持つ。 |
| Customer | Sale | 1 : N | 1顧客は複数会計を持つ。 |
| Customer | Reservation | 1 : N | 1顧客は複数予約を持つ。 |
| Customer | AdviceLog | 1 : N | 1顧客に複数アドバイス履歴。 |
| Customer | Staff (preferredStaff) | N : 1 | 希望担当（任意）。 |
| Visit | Sale | 1 : 0..1 | 来店に対し会計が0または1。 |
| Visit | Service | N : 1 | 来店の主メニュー参照（任意）。 |
| Sale | SaleItem | 1 : N | 会計は複数明細を持つ。 |
| SaleItem | Service | N : 1 | 施術明細のメニュー参照（任意）。 |
| SaleItem | Product | N : 1 | 店販明細の商品参照（任意）。 |
| Reservation | Service | N : 1 | 予約メニュー（任意）。 |
| Reservation | Staff | N : 1 | 指名/担当（任意）。 |
| Visit / Sale / Reservation | Staff | N : 1 | それぞれ担当スタッフ（任意）。 |
| Settings | — | singleton | 単一行。 |

### 3.2 テキストER図

```
                          ┌─────────────┐
                          │   Settings  │  (singleton: salon / AI / encryptedApiKey)
                          └─────────────┘

                          ┌─────────────┐
              preferred   │    Staff    │  (user + 担当者, role: owner/staff)
            ┌────────────▶│             │◀──────────────┐
            │  N        1 └──────┬──────┘ 1           N │
            │                    │ 1                    │
            │                    │ (担当)               │
   ┌────────┴────┐               ▼ N                    │
   │   Customer  │ 1        ┌─────────┐ N            1  │
   │ (顧客カルテ) │─────────▶│  Visit  │──────────────▶ Service ◀─┐
   │             │   N      │ (施術)  │ N            1   (メニュー)  │
   │             │          └────┬────┘                  ▲        │
   │             │  1            │ 1                      │ N      │
   │             │               │ 0..1                   │        │
   │             │  N       ┌────▼────┐ 1      N     ┌────┴────┐   │
   │             │─────────▶│  Sale   │────────────▶│ SaleItem│   │
   │             │          │ (会計)  │              │ (明細)  │   │
   │             │          └─────────┘              └────┬────┘   │
   │             │                                        │ N      │
   │             │                                        ▼ 1      │
   │             │                                    ┌────────┐   │
   │             │                                    │Product │   │
   │             │  N       ┌──────────────┐          │(店販)  │   │
   │             │─────────▶│ Reservation  │──────────└────────┘   │
   │             │          │ (予約)       │── service ────────────┘
   │             │          └──────────────┘── staff ──▶ Staff
   │             │  N       ┌──────────────┐
   │             │─────────▶│  AdviceLog   │  (catalog / ai 発火履歴)
   └─────────────┘          └──────────────┘
```

---

## 4. 派生指標の算出方法

派生指標は原則として永続化せず、サービス層/クエリで算出する。M6アラート・ダッシュボードの応答性のため、`avgVisitIntervalDays`・`nextPredictedVisitDate`・`visitCount`・`totalSales`・`retailPurchaseCount`・`rfmSegment` 等は Visit/Sale 確定時または夜間バッチで `Customer` のキャッシュ列へ反映する。

### 4.1 来店サイクル系

- **daysSinceLastVisit**
  `floor((today − lastVisitDate) / 1day)`。`lastVisitDate` が無い（未来店）顧客は `null`。

- **avgVisitIntervalDays（平均来店間隔）**
  顧客の Visit を日付昇順に並べ、連続する来店の差分（日数）配列 `intervals = [d2−d1, d3−d2, …]` を作る。
  - 既定アルゴリズム: **中央値（median）**。外れ値（長期離脱→復帰など）に頑健で、定常的な来店周期を表す。
    `avgVisitIntervalDays = median(intervals)`
  - 代替/補助: 直近 N=3〜5 件の**移動平均**（最近の周期変化に追従）。設定で median / moving-average を切替可能とする。
  - 来店が2回未満で `intervals` が空の場合は、当該顧客の主メニューの `Service.defaultCycleDays`（推奨周期）でフォールバック。

- **nextPredictedVisitDate（次回予測来店日）**
  `nextPredictedVisitDate = lastVisitDate + avgVisitIntervalDays（日）`。
  `avgVisitIntervalDays` がフォールバック値の場合も同式で算出。

- **cycleOverdueRatio（周期超過率）**
  `cycleOverdueRatio = daysSinceLastVisit / avgVisitIntervalDays`。
  - `= 1.0` 付近: ちょうど周期。
  - `> 1.0`: 超過（来るべき時期を過ぎている）。
  - **M6トリガ例**: `cycleOverdueRatio >= 0.8`（周期接近）AND `hasUpcomingReservation == false` AND `consentToContact == true` → 「そろそろ来店周期」アラート対象。

- **hasUpcomingReservation / nextReservationDate**
  `Reservation` のうち `status='booked'` かつ `startAt >= now` が存在すれば `true`。`nextReservationDate` はその最小 `startAt`。

### 4.2 売上系

- **avgSpend（客単価）**
  `avgSpend = totalSales / visitCount`（`visitCount = 0` のとき `null`）。会計回数ベースとする場合は `totalSales / countOf(Sale)`。本ツール既定は来店回数ベース。

- **ltv（顧客生涯価値, 簡易実績ベース）**
  既定は**累計実績**: `ltv = totalSales = Σ Sale.totalAmount`。
  拡張（予測LTV, 任意）: `avgSpend × 想定年間来店回数 × 想定継続年数`。想定年間来店回数 = `365 / avgVisitIntervalDays`。

- **lastSaleAmount**
  最新 `Sale.date` の `Sale.totalAmount`。

- **retailRatio（店販比率）**
  店販売上 / 総売上。
  `retailRatio = Σ(SaleItem.amount where itemType='product') / totalSales`。
  `retailPurchaseCount = countOf(SaleItem where itemType='product')`（または店販を含むSale数。既定は明細件数）。

### 4.3 RFM

対象期間（既定: 全期間、設定で直近12〜24ヶ月に限定可）の `Sale` を集計。

- **rfmRecency（最近性）**: `daysSince(最新 Sale.date)`。小さいほど良。
- **rfmFrequency（頻度）**: 対象期間内の会計回数 `countOf(Sale)`（または `visitCount`）。
- **rfmMonetary（金額）**: 対象期間内の `Σ Sale.totalAmount`。
- 各指標を全顧客内で**5分位（quintile, スコア1〜5）**にランク付け（Recencyは小さいほど高スコアになるよう反転）。
- **rfmSegment**: `(R,F,M)` のスコア組合せをラベル化（例: `Champions` = R≥4,F≥4,M≥4 / `AtRisk` = R≤2,F≥3 / `New` = R≥4,F≤2 等）。閾値はカタログ/ダッシュボードのセグメント定義と共有。

### 4.4 イベント系

- **daysToBirthday**: 次に到来する `birthday`（月日）までの日数。
- **daysToAnniversary**: 次に到来する `anniversaryDate`（月日, 既定=初来店記念日）までの日数。
- **lastService**: 最新 `Visit.date` の `Visit.menu`（または `Service.name`）。

---

## 5. Prismaスキーマ抜粋例

主要モデルの抜粋（SQLite想定。`String[]` 非対応のため配列はJSON文字列で保持）。

```prisma
// datasource / generator
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum CustomerStatus {
  new
  repeat
  dormant
}

model Customer {
  id               String    @id @default(cuid())
  name             String    // (PII)
  nameKana         String?   // (PII)
  birthday         DateTime? // (PII)
  gender           String?   // (PII)
  phone            String?   // (PII) 保存時暗号化推奨
  email            String?   // (PII) 保存時暗号化推奨
  registeredAt     DateTime  @default(now())
  status           CustomerStatus @default(new)

  preferredStaffId String?
  preferredStaff   Staff?    @relation("PreferredStaff", fields: [preferredStaffId], references: [id])

  consentToContact Boolean   @default(false)

  // カルテ（自由記述/要配慮は (PII)）
  hairType         String?
  skinType         String?
  allergies        String?   // JSON配列 (PII: 要配慮)
  preferences      String?   // (PII)
  notes            String?   // (PII)

  // 来店サイクル系キャッシュ列（派生指標はバッチ更新）
  firstVisitDate         DateTime?
  lastVisitDate          DateTime?
  visitCount             Int      @default(0)
  avgVisitIntervalDays   Float?
  nextPredictedVisitDate DateTime?

  // 売上系キャッシュ列
  totalSales          Int    @default(0)
  lastSaleAmount      Int?
  retailPurchaseCount Int    @default(0)
  rfmSegment          String?

  anniversaryDate  DateTime?
  lastContactDate  DateTime?
  reviewGiven      Boolean   @default(false)
  referralCount    Int       @default(0)

  visits        Visit[]
  sales         Sale[]
  reservations  Reservation[]
  adviceLogs    AdviceLog[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  @@index([status])
  @@index([lastVisitDate])
  @@index([nextPredictedVisitDate]) // M6: 周期接近の抽出
  @@index([deletedAt])
}

model Visit {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  date        DateTime
  staffId     String?
  staff       Staff?   @relation(fields: [staffId], references: [id])
  menu        String?
  serviceId   String?
  service     Service? @relation(fields: [serviceId], references: [id])
  products    String?  // JSON配列
  memo        String?  // (PII)
  saleId      String?  @unique
  sale        Sale?    @relation(fields: [saleId], references: [id])
  createdAt   DateTime @default(now())

  @@index([customerId, date]) // avgVisitIntervalDays 算出の主アクセス
  @@index([date])
}

model Reservation {
  id            String   @id @default(cuid())
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  startAt       DateTime
  endAt         DateTime?
  serviceId     String?
  service       Service? @relation(fields: [serviceId], references: [id])
  staffId       String?
  staff         Staff?   @relation(fields: [staffId], references: [id])
  status        String   @default("booked") // booked/done/cancelled/noshow
  source        String   @default("manual") // manual/m6_suggestion/import
  googleEventId String?  // M5: Googleカレンダー一方向同期
  memo          String?  // (PII)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([customerId, startAt]) // hasUpcomingReservation 判定
  @@index([startAt, status])
}
```

---

## 6. インデックス / プライバシー上の配慮

### 6.1 主なインデックス（性能要件）

| インデックス | 目的 |
|---|---|
| `Visit(customerId, date)` | `avgVisitIntervalDays` 算出・施術履歴表示の主アクセスパス。 |
| `Customer(nextPredictedVisitDate)` | M6: 予測日が近い/超過の顧客抽出を高速化。 |
| `Customer(status)`, `Customer(lastVisitDate)` | セグメント/休眠抽出・ダッシュボード集計。 |
| `Reservation(customerId, startAt)` / `Reservation(startAt, status)` | `hasUpcomingReservation` 判定・カレンダー表示。 |
| `Sale(customerId, date)` | RFM/LTV/客単価集計。 |
| `SaleItem(saleId)`, `SaleItem(itemType)` | 明細展開・店販比率集計。 |
| `Customer(deletedAt)` | 論理削除の除外フィルタ。 |
| `Staff(email)` (unique) | ログイン。 |

### 6.2 暗号化対象フィールド（保存時暗号化）

機微度が高く、漏洩時の影響が大きいフィールドはアプリ層で **AES-256-GCM**（鍵はサーバー環境変数 `ENCRYPTION_KEY` 由来、リポジトリ非格納）により暗号化して保存する。

- **必須暗号化**
  - `Settings.encryptedApiKey`（BYO Claude APIキー。平文保存は禁止）。`apiKeyIv` でnonce管理。
  - `Staff.passwordHash`（暗号化ではなく argon2 / bcrypt によるハッシュ。可逆化しない）。
- **強く推奨（PII最小化方針）**
  - `Customer.phone`, `Customer.email`（連絡先）。検索要件と両立する場合は決定的暗号化 or ハッシュ索引を併用。
  - `Customer.allergies`（要配慮情報）。
- **アプリ運用上の保護**
  - `Customer.name/nameKana/birthday/preferences/notes`, `Visit.memo`, `Reservation.memo` 等の自由記述PIIは、エクスポート時のマスキング/匿名化オプション対象。AIモードでは `Settings.aiSharedFields` / `anonymizeBeforeSend` により送信を制御。

### 6.3 プライバシー設計の原則（要件反映）

- **データはセルフホストのサーバー内のみ**。テレメトリ送信なし。顧客データはリポジトリに格納しない（`.gitignore` 徹底、SQLiteファイル・`.env`・バックアップを除外）。
- **連絡同意ゲート**: `consentToContact == false` の顧客はM6連絡文・DM・一括連絡の対象から除外。
- **開示・削除・同意管理（個情法/GDPR）**: 顧客単位の CSV / JSON エクスポート（開示請求対応）、`deletedAt` による論理削除＋物理削除API（消去権対応）、同意状態の更新履歴を保持。
- **AI連携の最小化**: 既定 `aiMode='offline'`（外部送信ゼロ）。連携時のみ、設定で許可したフィールドのみを匿名化して送信する。
