# 付録: 詳細仕様補遺（Draft 0.1 レビュー反映）

本補遺は、要件定義書 Draft 0.1 のレビューで検出された「実装可能な粒度に達していない／章間で不整合」な論点を解決し、設計・実装の正本とする。メイン要件定義書（[要件定義書.md](./要件定義書.md)）・[データモデル](./data-model.md)・[アドバイスカタログ](./advice-catalog.md)・[トリガDSLスキーマ](../data/trigger-dsl.schema.json)と相互参照する。

- 関連: [要件定義書](./要件定義書.md) ｜ [データモデル](./data-model.md) ｜ [アドバイスカタログ](./advice-catalog.md) ｜ [画面・UX](./screens.md)

---

## A. 顧客状態語彙の統一とマッピング

レビューで、顧客の「状態」を表す語彙が3系統（永続化status・来店サイクル状態・RFMセグメント）で混在していた。以下のとおり**3つの独立した軸**に分離し、各軸を別フィールドとして保持する。表示用ラベルは各軸から導出する。

| 軸 | 正本フィールド | 取りうる値 | 定義 | 用途 |
| --- | --- | --- | --- | --- |
| ① 永続ステータス | `Customer.status` | `new` / `repeat` / `dormant` | 来店回数と最終来店からの経過で機械判定。`visitCount<=1`→new、以降repeat、`daysSinceLastVisit > avgVisitIntervalDays × 3`（または既定180日）→dormant | 顧客の基本区分・絞り込み |
| ② 来店サイクル状態 | （派生・非永続） `cycleState` | `before`（予測前） / `approaching`（接近） / `overdue`（超過） / `dormant`（離反） | §B の正準トリガで算出。表示専用 | M6再来店提案・カルテ表示 |
| ③ RFMセグメント | `Customer.rfmSegment` | `vip` / `loyal` / `stable` / `new` / `at_risk` / `lost` | R・F・M各スコアの組合せで判定（[data-model.md](./data-model.md) §4参照） | M4分析・セグメント抽出 |

**画面表示ラベルの対応**（screens.md の表現を②③へ正規化）:

| 画面表現 | 対応する軸・値 |
| --- | --- |
| 「予測前 / 接近 / 超過」 | ② cycleState = before / approaching / overdue |
| 「優良 / 安定 / 新規 / 離反リスク」 | ③ rfmSegment = vip,loyal / stable / new / at_risk |
| 「要フォロー（FR-M1-09）」 | ② overdue または ③ at_risk のいずれか真 |
| 「休眠予備軍」 | ② approaching かつ `hasUpcomingReservation==false` |
| 「休眠」 | ① status = dormant |

> FR-M1-09 の4区分（アクティブ／要フォロー／休眠予備軍／休眠）は、上表のマッピングで①②③から導出する**表示カテゴリ**であり、新たな永続フィールドは設けない。

---

## B. M6 再来店提案の正準トリガ条件

レビューで、M6抽出条件が「日数ベース（±X日／超過Y日）」と「比率ベース（`cycleOverdueRatio`）」で章により不統一だった。以下を**唯一の正準条件**とする。両者を設定可能な合成条件として明示する。

### B.1 派生指標の定義（再掲・正本）

- `avgVisitIntervalDays` = 直近 `N` 回（既定 N=6、設定可）の連続来店間隔の**中央値**（外れ値に頑健）。来店2回未満は `null`。
- `nextPredictedVisitDate` = `lastVisitDate + avgVisitIntervalDays`。
- `cycleOverdueRatio` = `daysSinceLastVisit / avgVisitIntervalDays`（`avgVisitIntervalDays` が `null` のとき `null`）。

### B.2 cycleState 判定（しきい値は設定可能・既定値を明記）

| cycleState | 条件（既定値） |
| --- | --- |
| `before` | `cycleOverdueRatio < 0.8` |
| `approaching` | `0.8 ≤ cycleOverdueRatio < 1.0`（= 予測日まで残り約20%以内） |
| `overdue` | `cycleOverdueRatio ≥ 1.0`（予測日超過） |
| `dormant` | `cycleOverdueRatio ≥ 3.0` または `daysSinceLastVisit ≥ 180`（①statusのdormant条件と一致） |

> 比率の代わりに**日数しきい値**（例: 予測日の ±`approachWindowDays`=7日、超過 `overdueGraceDays`=0日）でも判定できるよう、設定で「比率モード／日数モード」を選択可能とする。既定は比率モード。

### B.3 M6 抽出条件（AC-M6-1/2 の判定式）

```text
抽出対象 =
  cycleState ∈ {approaching, overdue}     // §B.2
  AND hasUpcomingReservation == false      // 先の予約なし
  AND avgVisitIntervalDays != null         // 来店2回以上で来店周期が確定
  AND consentToContact == true             // §F: 連絡同意（後述）— 既定で抽出から除外
```

- **AC-M6-1**: `cycleState` が approaching/overdue かつ未予約の顧客のみがアラート一覧に出現する（before/予約済みは出ない）。
- **AC-M6-2**: 来店1回のみ（来店周期未確定）の顧客はM6対象外。新規定着はM6ではなくNRカテゴリ（カタログ）で扱う。

---

## C. トリガDSL（条件式）仕様

連携なしモードのルール評価エンジンが解釈する条件式の**形式仕様**を [`data/trigger-dsl.schema.json`](../data/trigger-dsl.schema.json) に定義した（JSON Schema 2020-12）。`advice-catalog` 各 item の文字列 `triggerRule` は**表示用**、本DSLのAST（`triggerAst`）が**評価用の正準形**である。

### C.1 構造

- ノードは **比較ノード** `{field, op, value}` か **論理ノード** `{all:[...]}` / `{any:[...]}` / `{not:{...}}` のいずれか。
- `field` は許可集合（スキーマの `field` enum）に限定。未知フィールドはパース時エラー。
- `op`: `== != > >= < <= in notIn between exists notExists isTrue isFalse withinDays overdueDays`。
- 日付フィールドは `withinDays`（予測日まで n 日以内）/ `overdueDays`（超過 n 日以上）を用いる。

### C.2 評価規則（欠損安全）

1. 値が `null`/未取得のフィールドに対する比較（`== > <` 等）は **false** を返す（例外送出しない）。
2. 明示的に欠損を扱う場合は `exists` / `notExists` を使う。
3. `all` は全子が真で真、`any` は1つでも真で真、空配列は不正（スキーマで `minItems:1`）。
4. 評価結果が真のアドバイスを `priority`（high>medium>low）→ カテゴリ既定順で整列し提示する。

### C.3 サンプル（スキーマ examples と一致）

```json
{ "all": [
  { "field": "hasUpcomingReservation", "op": "isFalse" },
  { "field": "cycleOverdueRatio", "op": ">=", "value": 1.2 },
  { "field": "status", "op": "!=", "value": "dormant" }
]}
```

> 実装時は、カタログ各itemに `triggerAst`（本スキーマ準拠）を付与し、`triggerRule` 文字列はそのAST由来の表示文へ統一する。評価エンジンには本スキーマ examples をテストケースの最小セットとして用いる。

---

## D. AIアドバイス機能要件（FR-AI / AC-AI）

第6章の重要要件にトレーサビリティ用の番号体系（`FR-AI-xx` / `AC-AI-x`）を付与する。

| ID | 要件 |
| --- | --- |
| FR-AI-01 | モード切替: 既定は連携なし（オフライン）。連携ありは明示オプトインでのみ有効化（M0設定）。 |
| FR-AI-02 | 連携なし評価: §C のDSLで `advice-catalog` を評価し、真のアドバイスを優先度順に提示する。外部送信を一切行わない。 |
| FR-AI-03 | 送信フィールド ホワイトリスト: 連携あり時に外部送信する項目は設定のホワイトリストに限定。既定でPII（氏名・電話・メール）はOFF。 |
| FR-AI-04 | 匿名化置換: 送信前にPIIを仮名プレースホルダ（例 `{{C1}}`）へ置換し、生成結果をローカルで実値へ再差込する。 |
| FR-AI-05 | 送信前プレビュー（最終ゲート）: 実際に送信される本文を送信直前に提示し、ユーザー確認なしには送信しない。 |
| FR-AI-06 | グラウンディング: カタログの該当カテゴリ項目を few-shot/参照として与え、ブランドトーンを保つ。 |
| FR-AI-07 | フォールバック: APIエラー・キー未設定・スキーマ不一致・タイムアウト時は連携なしモードへ自動フォールバックし、その旨を表示する。 |
| FR-AI-08 | ログ: 連携あり送信は送信日時・対象顧客・送信フィールド種別・モデルを `AdviceLog` に記録（本文PIIは保存しない設定可）。 |

| ID | 受け入れ条件 |
| --- | --- |
| AC-AI-1 | 連携なしモードでは、ネットワーク遮断下でもアドバイス提示が完結する（外部通信ゼロをテストで確認）。 |
| AC-AI-2 | 送信フィールドOFFのPIIが、プレビュー・実送信ペイロードのいずれにも出現しない。 |
| AC-AI-3 | プレビューでキャンセルすると一切送信されない。 |
| AC-AI-4 | キー未設定／API失敗時に連携なし結果が代替表示され、ユーザー操作が中断しない。 |

---

## E. 客単価・LTV・割引の正準定義

- **客単価 `avgSpend`（正本）**: `totalSales / visitCount`（来店回数ベース）。`visitCount=0` のとき `null`。会計回数ベースは採用しない（来店と会計が1:0..1のため不一致が生じるため）。用語定義・FR-M2-04・data-model §4.2 を本定義に統一する。
- **LTV `ltv`（正本）**: 既定は**累計実績** `Σ Sale.totalAmount`。予測LTVは任意拡張（[data-model.md](./data-model.md) §4.2）。FR-M2-06 は「実績LTVを既定、予測LTVはオプション」とする。
- **割引（保持先を確定）**: 会計レベル割引は `Sale.discountAmount`、明細レベル割引は `SaleItem.lineDiscount` に保持（[data-model.md](./data-model.md) §2.4/2.5 で追加済み）。`totalAmount = Σ SaleItem.amount − discountAmount`。FR-M2-03「割引の自動算出」はこの2フィールドを正本に算出する。

---

## F. データ保持・同意・撤回ポリシー（個情法/GDPR）

第9章のコンプライアンス要件を実装可能な粒度へ具体化する。

| ID | 要件 |
| --- | --- |
| FR-PRIV-01 | 連絡同意 `consentToContact`: 連絡（DM・連絡文提示・M6抽出）は同意=trueの顧客に限定。既定はfalse。 |
| FR-PRIV-02 | 同意撤回の即時反映: `consentToContact` を false に変更した時点で、M6抽出対象・連絡文生成・送信候補から即時除外する（バッチ遅延なし）。 |
| FR-PRIV-03 | 保持期間: 顧客データの保持上限を設定可能（既定: 最終来店から3年）。上限超過の休眠顧客は「アーカイブ候補」として通知し、ワンクリックで論理削除できる。自動物理削除は既定OFF。 |
| FR-PRIV-04 | 削除フロー: 論理削除（復元可）→ 猶予期間（既定30日）→ 物理削除。物理削除は復元不可の確認UIを要する。 |
| FR-PRIV-05 | 開示・エクスポート: 個人単位でカルテ・履歴をCSV/JSON出力できる（開示請求対応）。 |
| FR-PRIV-06 | 変更履歴: `consentToContact` の変更日時を記録し、撤回後の連絡停止を監査可能にする。 |

---

## G. AdviceLog（効果測定）の活用要件

データモデルの `AdviceLog`（`status: suggested/accepted/dismissed/acted`）を「収集して終わり」にせず、振り返りに接続する。

| ID | 要件 |
| --- | --- |
| FR-ADV-01 | アクション記録: 提示したアドバイス／M6提案に対し「採用（予約案作成）」「連絡済み」「対象外（dismiss）」を1クリックで記録する。 |
| FR-ADV-02 | 採用率の可視化: M4ダッシュボードに「アドバイス採用率」「再来店提案→実予約転換率」を表示する（任意機能としてv1に含めても可）。 |
| FR-ADV-03 | カテゴリ別効果: カタログのカテゴリ別に提示数・採用数を集計し、効果の低い定型アドバイスの見直し材料とする。 |

---

## 反映サマリ（Draft 0.1 → 0.2 で解決した論点）

| 論点 | 反映先 |
| --- | --- |
| アドバイス件数の表記揺れ（約100/110） | 全章を**110件**に統一・第14章Q1を解決済みに更新 |
| 英語のAI独り言混入・誤字 | 本文から除去・修正 |
| 顧客状態語彙の不統一 | §A マッピング表 |
| M6トリガ基準（日数/比率）不整合 | §B 正準条件 |
| triggerRule DSLの形式未定義 | §C ＋ `data/trigger-dsl.schema.json` |
| FR-AI番号体系・ACの欠落 | §D |
| 客単価分母の二重定義・割引保持先 | §E ＋ data-model.md 追記 |
| データ保持/同意撤回ポリシー欠落 | §F |
| AdviceLog効果測定の未活用 | §G |
