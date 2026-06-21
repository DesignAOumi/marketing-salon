# アドバイスカタログ（連携なしモード用 定型アドバイス）

本カタログは「AI連携なしモード」で使用する定型アドバイス集です。各項目の triggerRule を顧客データに照合し、マッチしたものを優先度順に提示します。機械可読な全フィールドは [data/advice-catalog.json](../data/advice-catalog.json) を参照してください。

- 総件数: **110件**
- データ語彙（トリガで使用する項目）は要件定義書 第6章および data-model.md を参照。

## カテゴリ別件数

| カテゴリ | id接頭辞 | 件数 |
|---|---|---|
| 再来店促進・来店サイクル | RV | 15 |
| 離反防止・休眠顧客復帰 | CH | 12 |
| アップセル（上位メニュー誘導） | UP | 10 |
| クロスセル・店販提案 | CS | 12 |
| 客単価・LTV向上 | LTV | 8 |
| 新規→リピート定着 | NR | 10 |
| 記念日・誕生日・節目 | AN | 8 |
| 季節・イベント・キャンペーン | SE | 10 |
| カルテベースのケア提案 | KT | 10 |
| VIP・上位顧客ロイヤルティ | VIP | 8 |
| 紹介・口コミ促進 | RF | 7 |
| **合計** |  | **110** |


## 再来店促進・来店サイクル

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| RV-01 | 来店サイクル超過の初期アラート（軽度・未予約） | 高 | cycleOverdueRatio>=1.1 && cycleOverdueRatio<1.3 && hasUpcomingReservation==false && status=="repeat" && consentToContact==true | 来店サイクル提案アラートを発行し、次回予測日を添えたLINE/メールの予約打診を送付 |
| RV-02 | 来店サイクル明確超過の本格リマインド（中度・未予約） | 高 | cycleOverdueRatio>=1.3 && cycleOverdueRatio<1.6 && hasUpcomingReservation==false && status=="repeat" && consentToContact==true | 担当スタッフ名入りの再来店リマインドを送付し、予約案をワンクリック作成して提示 |
| RV-03 | 来店サイクル大幅超過のラストコール（重度・離反寸前） | 高 | cycleOverdueRatio>=1.6 && hasUpcomingReservation==false && status=="repeat" && consentToContact==true | 再来店限定クーポンを付与したラストコールDMを送付し、予約導線を最優先表示 |
| RV-04 | 次回予測日が間近の事前予約打診（先回り提案） | 中 | nextPredictedVisitDate<=today+7 && nextPredictedVisitDate>=today && hasUpcomingReservation==false && cycleOverdueRatio<1.1 && consentToContact==true | 先回り予約打診を送付し、予測日近辺の空き枠を候補提示して予約案を作成 |
| RV-05 | VIP顧客の周期超過 最優先フォロー | 高 | rfmSegment=="VIP" && cycleOverdueRatio>=1.2 && hasUpcomingReservation==false && consentToContact==true | VIP最優先アラートを発行し、担当者による個別連絡とプレミアム枠の優先確保を促す |
| RV-06 | 新規客の2回目来店促進（リピート定着の最重要関門） | 高 | status=="new" && visitCount==1 && daysSinceLastVisit>=avgVisitIntervalDays*0.8 && hasUpcomingReservation==false && consentToContact==true | 2回目来店限定オファー付きのサンクスメッセージを送付し、次回予約導線を提示 |
| RV-07 | 休眠移行直前の引き留め（90日級・要注意） | 中 | daysSinceLastVisit>90 && daysSinceLastVisit<=120 && status=="repeat" && hasUpcomingReservation==false && consentToContact==true | 休眠移行アラートを発行し、近況伺いトーンの再来店メッセージを送付 |
| RV-08 | 長期休眠顧客の掘り起こし（120日超・カムバック） | 中 | daysSinceLastVisit>120 && status=="dormant" && consentToContact==true | カムバック限定クーポンを付与した掘り起こしDMを送付し、復帰メニューを提案 |
| RV-09 | 来店間隔が伸長傾向の顧客への早期介入 | 中 | daysSinceLastVisit>avgVisitIntervalDays && cycleOverdueRatio>=1.05 && cycleOverdueRatio<1.25 && rfmFrequency>=3 && hasUpcomingReservation==false && consentToContact==true | サイクル緩み検知アラートを発行し、定期来店の習慣維持を促すメッセージを送付 |
| RV-10 | 周期超過かつ連絡不通の顧客への再アプローチ | 中 | cycleOverdueRatio>=1.3 && hasUpcomingReservation==false && lastContactDate<today-21 && consentToContact==true | 前回と異なるチャネル（LINE↔メール↔電話）での再アプローチを提案し、訴求軸を変更 |
| RV-11 | 周期超過顧客への次回メニュー提案セット | 中 | cycleOverdueRatio>=1.2 && hasUpcomingReservation==false && visitCount>=3 && lastService!=null && consentToContact==true | 次回メニュー提案を添えた予約打診を送付し、提案メニュー込みの予約案を作成 |
| RV-12 | 予測日にイベント（誕生日・記念日）が重なる顧客の特別提案 | 中 | cycleOverdueRatio>=1.0 && hasUpcomingReservation==false && (daysToBirthday<=14 \|\| daysToAnniversary<=14) && consentToContact==true | 誕生日/記念日連動の特別オファーを発行し、イベント前の予約枠を提案 |
| RV-13 | 高単価・低頻度顧客のサイクル維持フォロー | 中 | avgSpend>=15000 && rfmFrequency<=2 && cycleOverdueRatio>=1.15 && hasUpcomingReservation==false && consentToContact==true | 上質トーンの個別フォローを送付し、ゆとりある時間枠での予約案を優先提示 |
| RV-14 | 店販リピート連動の来店周期フォロー（商材切れ予測） | 低 | retailPurchaseCount>=1 && cycleOverdueRatio>=1.1 && retailRatio>=0.1 && hasUpcomingReservation==false && consentToContact==true | 店販商材切れ予測アラートを発行し、商品補充を口実にした来店打診を送付 |
| RV-15 | 周期超過顧客の一斉抽出と優先順位付き来店促進バッチ | 高 | cycleOverdueRatio>=1.2 && hasUpcomingReservation==false && consentToContact==true && (rfmSegment!="loss" \|\| daysSinceLastVisit<=150) | M6ダッシュボードで周期超過×未予約リストを優先度順に一括生成し、上位から予約案・連絡文をバッチ作成 |

## 離反防止・休眠顧客復帰

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| CH-01 | 来店サイクル超過の予兆を検知（軽度・先約なし） | 高 | status=="repeat" && cycleOverdueRatio>=1.1 && cycleOverdueRatio<1.4 && hasUpcomingReservation==false && consentToContact==true | 来店サイクル提案アラートを発行し、次回予測日前後3日の空き枠を添えたLINE/メールを送付。ワンクリックで予約案を作成。 |
| CH-02 | VIP・優良顧客の周期超過を最優先フォロー | 高 | (rfmSegment=="VIP" \|\| ltv>=300000) && cycleOverdueRatio>=1.2 && hasUpcomingReservation==false && consentToContact==true | 担当スタッフ名義の個別連絡（電話またはパーソナルメッセージ）を発行し、優先枠の確保＋次回メニュー提案をセットで提示。 |
| CH-03 | 新規客の2回目来店が途切れる予兆を検知 | 高 | visitCount<=2 && cycleOverdueRatio>=1.2 && hasUpcomingReservation==false && daysSinceLastVisit>45 && consentToContact==true | 2回目来店促進フローを発行。初回お礼＋次回限定特典（再来店クーポン）付きメッセージを送付し、メニュー提案を添える。 |
| CH-04 | 周期超過＋連絡未実施の取りこぼし防止 | 中 | cycleOverdueRatio>=1.3 && hasUpcomingReservation==false && (lastContactDate==null \|\| daysSinceLastVisit-30>0) && consentToContact==true | フォロー漏れリストを抽出し、近況伺い中心の軽いリエンゲージメント連絡を発行。送信後にlastContactDateを更新。 |
| CH-05 | 休眠初期（60〜90日未来店）への復帰オファー | 高 | daysSinceLastVisit>=60 && daysSinceLastVisit<90 && hasUpcomingReservation==false && status!="dormant" && consentToContact==true | 休眠初期セグメントへ限定クーポン付き復帰オファーをLINE/メールで送付。来店サイクル提案アラートと連動して予約導線を提示。 |
| CH-06 | イベント連動の自然な再来店きっかけ作り | 中 | cycleOverdueRatio>=1.1 && hasUpcomingReservation==false && (daysToBirthday<=21 \|\| daysToAnniversary<=21) && consentToContact==true | 誕生日/記念日トリガーで祝意＋特典メッセージを発行。予約案作成ボタンから希望日提案までワンクリックで連携。 |
| CH-07 | 店販ゼロ層の自宅ケア起点での再来店促進 | 中 | cycleOverdueRatio>=1.2 && retailRatio<0.1 && retailPurchaseCount==0 && hasUpcomingReservation==false && consentToContact==true | ホームケア提案フローを発行。次回来店時のカウンセリング予約と、髪質/肌質に合う店販サンプル案内をメッセージに同梱。 |
| CH-08 | 休眠認定（90〜180日）への本格復帰キャンペーン | 高 | status=="dormant" && daysSinceLastVisit>=90 && daysSinceLastVisit<180 && hasUpcomingReservation==false && consentToContact==true | 休眠復帰キャンペーンを発行し、再来店限定の優待＋カウンセリング無料案内を送付。反応がなければ次段階フォロー（CH-10）へ自動エスカレーション。 |
| CH-09 | 高LTV休眠顧客のVIP復帰アプローチ | 高 | status=="dormant" && (rfmSegment=="VIP" \|\| ltv>=300000 \|\| avgSpend>=15000) && daysSinceLastVisit>=120 && hasUpcomingReservation==false && consentToContact==true | VIP休眠復帰として担当スタッフ名義の個別連絡（電話/パーソナルメッセージ）を発行。指名優先枠・限定メニュー・関係再構築を主軸に提示。 |
| CH-10 | 長期休眠（180〜365日）への最終掘り起こし | 中 | status=="dormant" && daysSinceLastVisit>=180 && daysSinceLastVisit<365 && hasUpcomingReservation==false && consentToContact==true | 長期休眠向け最大級の復帰特典＋心理的ハードルを下げるメッセージを発行。複数チャネル（メール＋LINE等）で一度だけ再アプローチし、反応で離反確定判定。 |
| CH-11 | ロイヤル顧客の頻度低下（離反兆候）を早期検知 | 高 | rfmFrequency>=4 && rfmRecency<=2 && cycleOverdueRatio>=1.15 && hasUpcomingReservation==false && consentToContact==true | 離反初期アラートを発行。満足度ヒアリングを兼ねた担当者フォロー連絡を送り、必要に応じて次回優先予約とメニュー見直しを提案。 |
| CH-12 | 離反確定間際（1年超）のクローズ＆同意整理 | 低 | status=="dormant" && daysSinceLastVisit>=365 && hasUpcomingReservation==false | ラストリマインドを一度のみ送付。反応がなければconsentToContactをfalseに更新し連絡対象から除外、保持不要な機微データの削除候補としてフラグ付け。 |

## アップセル（上位メニュー誘導）

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| UP-01 | カット単発リピーターへトリートメント追加提案 | 高 | status=="repeat" && lastService=="カット" && avgSpend<6000 && retailRatio<0.1 && visitCount>=3 | 次回メニュー提案カードを発行し、来店時にトリートメント追加を口頭オファー |
| UP-02 | 髪質悩み顧客へ縮毛矯正の上位施術案内 | 高 | hairType=="くせ毛" && lastService!="縮毛矯正" && visitCount>=2 && consentToContact==true | 次回メニュー提案として縮毛矯正カウンセリング枠をLINEで案内 |
| UP-03 | 頭皮悩み顧客へヘッドスパ初回体験オファー | 中 | (skinType=="脂性" \|\| skinType=="乾燥") && lastService!="ヘッドスパ" && visitCount>=2 | 次回来店時にヘッドスパ体験コース（短時間版）をセット提案 |
| UP-04 | 来店サイクル超過の優良顧客へ上位メニュー付き呼び戻し | 高 | cycleOverdueRatio>=1.2 && rfmFrequency>=4 && hasUpcomingReservation==false && consentToContact==true | 来店サイクル提案アラートを発行し、上位メニュー優待付きの呼び戻しLINE/DMを送付 |
| UP-05 | カラー常連へケアブリーチ/ハイトーン上位メニュー提案 | 中 | lastService=="カラー" && visitCount>=4 && avgSpend>=7000 && avgSpend<12000 | 次回メニュー提案としてデザインカラー/ケアブリーチのカウンセリングを予約時に案内 |
| UP-06 | VIP顧客へプレミアム上位コース案内 | 高 | rfmSegment=="VIP" && consentToContact==true && hasUpcomingReservation==false | 指名スタッフ名義でプレミアムコース優先予約をパーソナルに案内 |
| UP-07 | 新規2回目来店者へ早期トリートメント定着提案 | 中 | status=="new" && visitCount==2 && lastService!="トリートメント" && consentToContact==true | 次回来店時にケアメニューお試し提案、定着を狙ったフォローLINEを送付 |
| UP-08 | 誕生月顧客へバースデー上位メニュー特典 | 中 | daysToBirthday<=21 && consentToContact==true && avgSpend<10000 | 誕生月限定クーポン付きで上位メニュー特典をLINE/DM送付 |
| UP-09 | 長期高頻度・低ケア顧客へ集中ケアプログラム提案 | 中 | visitCount>=10 && rfmFrequency>=4 && retailPurchaseCount==0 && lastService!="トリートメント" | 複数回コース（集中ケアプログラム）の提案資料を用意し来店時にカウンセリング |
| UP-10 | アニバーサリー記念で上位メニューへのグレードアップ提案 | 低 | daysToAnniversary<=14 && status=="repeat" && visitCount>=6 && consentToContact==true | アニバーサリー特典として上位コースへのグレードアップを次回予約時に案内 |

## クロスセル・店販提案

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| CS-01 | 店販比率が極端に低いリピーターへの基本ホームケア提案 | 高 | status=="repeat" && visitCount>=3 && retailRatio<0.1 | 次回来店時の店販提案メモを担当者に通知＋施術メニュー連動のシャンプーサンプル準備 |
| CS-02 | 多数来店でも店販購入ゼロの顧客への初回ホームケア導入 | 高 | visitCount>=5 && retailPurchaseCount==0 | 指名担当者へ初回店販提案アラート発行＋カウンセリング時のテスター案内をリマインド |
| CS-03 | ダメージ毛・ハイダメージ髪質向けトリートメント提案 | 高 | hairType in ["damaged","dry","colored"] && retailRatio<0.15 | 施術後カウンセリングで集中補修トリートメント提案＋次回メニュー提案に自宅ケア前提プランを追加 |
| CS-04 | 肌質に基づくスキンケア・頭皮ケア店販提案 | 中 | skinType!=null && retailRatio<0.15 && visitCount>=2 | 肌質タグ連動の店販リスト提示＋次回来店時のサンプル配布手配 |
| CS-05 | VIP顧客向けプレミアム店販ライン提案 | 高 | rfmSegment=="VIP" && retailRatio<0.2 | VIP限定プレミアムライン先行案内をLINE/DM送付＋来店時の優先カウンセリング枠確保 |
| CS-06 | カラー/パーマ履歴に基づく色持ち・形状保持製品提案 | 高 | lastService in ["color","perm"] && retailRatio<0.2 | 施術当日に色持ち/形状保持専用ケアを会計前提案＋次回カラー/パーマ予約サイクルと併せて案内 |
| CS-07 | 季節要因に応じたシーズンケア店販提案 | 中 | retailRatio<0.2 && hasUpcomingReservation==true | 次回来店日に合わせた季節ケア提案を担当者にリマインド＋予約確認連絡に季節ケア一言を添付 |
| CS-08 | 来店サイクル到来時の店販リフィル同時提案 | 中 | cycleOverdueRatio>=0.9 && cycleOverdueRatio<1.3 && retailRatio<0.2 | 来店サイクル提案アラート発行＋予約提案に店販リフィル同時提案フラグを付与 |
| CS-09 | アレルギー配慮の低刺激ケア製品提案 | 中 | allergies.length>0 && retailRatio<0.2 | アレルギー成分除外フィルタで安全製品リスト作成＋来店時の成分説明メモを担当者へ共有 |
| CS-10 | 過去購入者の店販リピート（買い替え）リマインド | 中 | retailPurchaseCount>=1 && retailRatio<0.2 && daysSinceLastVisit>60 | 買い替えリマインドをLINE/メール送付＋来店時の取り置き手配＋次回予約提案を併記 |
| CS-11 | 新規顧客への初回ホームケア体験提案 | 中 | status=="new" && retailPurchaseCount==0 && visitCount<=2 | 新規向けトライアルサイズ提案＋次回来店時のカウンセリングでホームケア説明を組み込む |
| CS-12 | 高客単価だが店販比率が低い顧客への構成最適化提案 | 高 | avgSpend>=8000 && retailRatio<0.15 && status=="repeat" | 高単価顧客向け店販提案アラート発行＋施術満足度を起点にしたカウンセリングトークを担当者へ提示 |

## 客単価・LTV向上

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| LTV-01 | 客単価が平均以下のリピーターへ単品アドオン提案 | 高 | status=="repeat" && visitCount>=3 && avgSpend<8000 && retailRatio<0.15 && hasUpcomingReservation==true | 次回予約の施術メモに『単品アドオン提案』フラグを立て、来店時にトリートメント等を口頭＋本文面で提案 |
| LTV-02 | 店販ほぼゼロ層へのホームケア商品クロスセル | 中 | visitCount>=4 && retailPurchaseCount<=1 && retailRatio<0.1 && daysSinceLastVisit<=avgVisitIntervalDays | 次回来店時の店販提案リストに追加し、サンプル/テスター準備＋LINEで事前案内を送付 |
| LTV-03 | 高頻度・低単価層への回数券／コース化提案 | 高 | rfmFrequency>=4 && avgSpend<7000 && ltv<80000 && avgVisitIntervalDays<=45 | 次回会計時に回数券提案を実施し、よく使うメニューに合致した券種をPOS/予約メモに紐付け |
| LTV-04 | VIPの単価下落を捉えた上位メニュー維持提案 | 高 | rfmSegment=="VIP" && lastSaleAmount<avgSpend && consentToContact==true | 担当スタッフ名義でのパーソナルDM送付＋上位メニューの優先枠を確保して個別提案 |
| LTV-05 | 新規定着初期のコース・定期化オンボーディング | 中 | status=="new" && visitCount>=2 && visitCount<=3 && hasUpcomingReservation==false && daysSinceLastVisit<60 | 次回予約獲得アラートを発行し、初回コース特典付きの定期化案内をLINE/メールで送付 |
| LTV-06 | 来店サイクルが安定した常連の定期メンテ会員化 | 中 | status=="repeat" && visitCount>=6 && cycleOverdueRatio>=0.8 && cycleOverdueRatio<=1.1 && avgVisitIntervalDays<=50 | 来店サイクル提案アラートと連動して定期会員プラン案内を発行し、優先予約枠特典を提示 |
| LTV-07 | 単一メニュー固定客への季節セットメニュー拡張 | 低 | visitCount>=4 && avgSpend<9000 && retailRatio<0.2 && daysToBirthday>30 | 季節セットメニュー提案を次回来店メモに登録し、限定感を訴求するLINE一斉案内のセグメント対象に追加 |
| LTV-08 | 高LTV顧客のサイクル乱れに先回りする回数券前売り | 高 | ltv>=150000 && cycleOverdueRatio>=1.2 && cycleOverdueRatio<1.6 && hasUpcomingReservation==false && consentToContact==true | 来店サイクル超過アラートを発行し、特典付き回数券の前売り案内を担当スタッフ名義でDM送付＋予約案を同時提示 |

## 新規→リピート定着

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| NR-01 | 初回来店後の2回目誘導フォロー | 高 | status=="new" && visitCount==1 && daysSinceLastVisit>=14 && daysSinceLastVisit<=30 && hasUpcomingReservation==false && consentToContact==true | 2回目来店促進メッセージをLINE/メールで個別送付し、希望日があれば次回予約案を作成する |
| NR-02 | 初回特典・クーポン有効期限前リマインド | 高 | visitCount==1 && status=="new" && hasUpcomingReservation==false && daysSinceLastVisit>=30 && daysSinceLastVisit<=50 && consentToContact==true | 有効期限を明記した特典リマインドを送付し、ワンクリック予約導線（指名スタッフ込み）を提示する |
| NR-03 | 2回目来店達成・3回目定着への橋渡し | 高 | visitCount==2 && hasUpcomingReservation==false && cycleOverdueRatio>=1.0 && cycleOverdueRatio<1.3 && consentToContact==true | 来店サイクルに基づく次回予測日を添えた3回目予約提案を発行し、予約案を自動下書きする |
| NR-04 | 初回から離脱しかけの新規ウィンバック | 中 | status=="new" && visitCount==1 && cycleOverdueRatio>=1.5 && daysSinceLastVisit<120 && hasUpcomingReservation==false && consentToContact==true | ウィンバック用の再来優待付きメッセージを送付し、フィードバック収集の一言を添える |
| NR-05 | 次回予約ありの新規へ来店前ホスピタリティ | 中 | status=="new" && visitCount<=2 && hasUpcomingReservation==true && consentToContact==true | 来店日前リマインドと事前ヒアリングメッセージを送付し、指名スタッフへ申し送りメモを作成する |
| NR-06 | 初回来店直後の店販提案で接点増強 | 中 | visitCount<=2 && status=="new" && retailRatio<0.1 && retailPurchaseCount==0 && consentToContact==true | 施術に紐づくホームケア商品の提案メッセージを送付し、次回来店時の店販提案メモを登録する |
| NR-07 | 新規顧客の誕生日特典で再来動機づけ | 中 | status=="new" && visitCount<=2 && daysToBirthday<=30 && daysToBirthday>=0 && hasUpcomingReservation==false && consentToContact==true | 誕生月限定特典付きの来店提案を送付し、特典コードと有効期限を付与する |
| NR-08 | 高評価・好反応の新規へ指名定着の後押し | 中 | status=="new" && visitCount==2 && reviewGiven==true && preferredStaff!=null && hasUpcomingReservation==false && consentToContact==true | 指名スタッフ名義のお礼+次回提案メッセージを送付し、担当固定で次回予約案を作成する |
| NR-09 | 連絡先未取得・同意なし新規の関係構築設計 | 低 | status=="new" && visitCount<=2 && consentToContact==false && hasUpcomingReservation==false | 次回来店時の連絡同意取得タスクをスタッフToDoに登録し、登録特典の案内を準備する |
| NR-10 | 3回目到達で定着完了・優良顧客化の起点づくり | 高 | visitCount==3 && cycleOverdueRatio>=0.8 && cycleOverdueRatio<1.2 && hasUpcomingReservation==false && consentToContact==true | 感謝メッセージとともに次回サイクルに沿った定期来店提案を発行し、定番化を促す予約案を作成する |

## 記念日・誕生日・節目

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| AN-01 | 誕生月の事前バースデー特典案内（30日前） | 中 | daysToBirthday<=30 && daysToBirthday>7 && consentToContact==true | 誕生月特典付きLINE/メールを30日前に自動配信し、予約導線リンクを添付 |
| AN-02 | 誕生日直前リマインド＆当日予約提案（7日前） | 高 | daysToBirthday<=7 && daysToBirthday>=0 && hasUpcomingReservation==false && consentToContact==true | 予約サイクル提案アラートを発行し、空き枠2〜3候補を載せたDMをワンクリック送信 |
| AN-03 | VIP向けバースデー特別おもてなし招待（21日前） | 高 | rfmSegment=="VIP" && daysToBirthday<=21 && daysToBirthday>0 && consentToContact==true | 担当者名義のパーソナル招待メッセージを送付し、優先予約枠を確保 |
| AN-04 | 初来店1周年（アニバーサリー）感謝メッセージ | 中 | daysToAnniversary<=14 && daysToAnniversary>=0 && visitCount>=2 && consentToContact==true | アニバーサリー特典付きメッセージを送付し、記念来店の予約提案を添付 |
| AN-05 | 記念日を口実にした休眠顧客の掘り起こし | 高 | status=="dormant" && daysSinceLastVisit>120 && (daysToBirthday<=30 \|\| daysToAnniversary<=30) && consentToContact==true | 記念日トリガーの掘り起こしクーポン（再来限定）をLINEで送付し、来店サイクル提案アラートと連動 |
| AN-06 | 季節の節目セルフケア提案（季節催事連動） | 低 | status=="repeat" && daysSinceLastVisit<=avgVisitIntervalDays && hasUpcomingReservation==false && consentToContact==true | 季節テーマのケア提案メッセージを配信し、次回メニュー提案リンクを添付 |
| AN-07 | 誕生日・記念月の店販ギフト提案（店販比率が低い層） | 中 | retailRatio<0.1 && (daysToBirthday<=21 \|\| daysToAnniversary<=21) && consentToContact==true | 記念月限定の店販ギフトセットを提案するメッセージを送付し、来店時の試用を案内 |
| AN-08 | 連絡不可・予約済み顧客への来店時お祝いメモ | 低 | daysToBirthday<=30 && (consentToContact==false \|\| hasUpcomingReservation==true) | 来店当日のお祝いメモ／バースデーカードをスタッフ向けタスクとして登録（外部送信なし） |

## 季節・イベント・キャンペーン

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| SE-01 | 梅雨の広がり・うねり対策（くせ毛・縮毛矯正提案） | 高 | currentMonth in [5,6] && hairType in ["wavy","curly","frizzy"] && cycleOverdueRatio>=0.8 && hasUpcomingReservation==false | 梅雨対策メニュー提案アラート発行＋縮毛矯正/うねりケアの来店サイクル提案を作成し、LINEまたはメールで先行案内を送付 |
| SE-02 | 夏のダメージ・退色ケア（カラー＆UVトリートメント） | 中 | currentMonth in [6,7,8] && lastService=="color" && daysSinceLastVisit>30 && hasUpcomingReservation==false && consentToContact==true | 次回メニュー提案（カラーメンテ＋UV/ダメージケアトリートメントのセット）を作成し、限定の夏ケアクーポン付きでLINE送付 |
| SE-03 | 秋冬の乾燥・静電気対策（保湿トリートメント店販） | 中 | currentMonth in [10,11,12,1,2] && retailRatio<0.1 && visitCount>=2 && hairType in ["dry","damaged"] | 店販提案（保湿トリートメント/ヘアオイル）を次回来店時の声かけリストに追加＋サンプル同梱の案内をDM送付 |
| SE-04 | 成人式の前撮り・当日ヘアセット早期予約（新成人） | 高 | currentMonth in [9,10,11,12,1] && gender=="female" && ageInYears in [19,20] && hasUpcomingReservation==false | 成人式ヘアセット予約アラート発行＋前撮り/当日の2枠提案を作成し、担当スタイリスト指名で早期予約案内を送付 |
| SE-05 | 卒業・入学式シーズンの親子・節目ヘア提案 | 中 | currentMonth in [2,3] && ageInYears between 30 and 50 && cycleOverdueRatio>=1.0 && hasUpcomingReservation==false | 来店サイクル提案アラート＋式典前メンテ（白髪染め/カット/当日セット）の予約案を作成し、3月前半までの来店を促すDMを送付 |
| SE-06 | 年末年始の前に整える（12月の駆け込み予約喚起） | 高 | currentMonth==12 && status=="repeat" && hasUpcomingReservation==false && daysSinceLastVisit>=avgVisitIntervalDays*0.7 | 年内最終来店の予約サイクル提案アラート発行＋希望日ヒアリングの一斉DM（混雑カレンダー付き）を送付 |
| SE-07 | 新年の心機一転イメチェン提案（休眠の呼び戻し） | 高 | currentMonth==1 && status=="dormant" && daysSinceLastVisit>120 && consentToContact==true | 休眠呼び戻しフローを起動し、新春限定クーポン付きLINE/メールを送付＋イメチェン相談の予約導線を提示 |
| SE-08 | 夏祭り・花火大会の浴衣ヘアアレンジ（イベント単発需要） | 低 | currentMonth in [7,8] && gender=="female" && ageInYears<35 && rfmFrequency>=2 && consentToContact==true | 浴衣ヘアセットの単発メニュー提案をDM/LINEで案内し、イベント日程に合わせた当日予約枠を提示 |
| SE-09 | VIP向け季節先行・限定キャンペーン優先案内 | 高 | rfmSegment=="VIP" && ltv>=300000 && consentToContact==true && hasUpcomingReservation==false | VIP優先案内フローを起動し、季節限定メニューの先行予約枠を確保した上で、担当スタイリスト名でパーソナルなDMを送付 |
| SE-10 | 母の日・敬老の日など贈答シーズンのギフト/同伴提案 | 低 | currentMonth in [5,9] && (referralCount>=1 \|\| retailPurchaseCount>=2) && consentToContact==true | ギフトチケット/店販ギフトセットの案内DMを送付＋親子・同伴来店プランの予約導線を提示 |

## カルテベースのケア提案

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| KT-01 | ダメージ毛×カラー後のトリートメント提案 | 高 | hairType=="damaged" && (lastService=="color" \|\| lastService=="bleach") && daysSinceLastVisit>=21 | 次回メニューに集中トリートメントを追加した予約案を作成し、LINEまたはメールで提案を送付 |
| KT-02 | 敏感肌×フェイシャル後の低刺激ホームケア案内 | 高 | skinType=="sensitive" && lastService=="facial" && daysSinceLastVisit>=10 && daysSinceLastVisit<=30 | 敏感肌向け低刺激ホームケア商品の提案メッセージを送付し、次回フェイシャルの予約サイクル提案を併記 |
| KT-03 | アレルギー登録客への施術前パッチテスト確認 | 高 | allergies.length>0 && hasUpcomingReservation==true && (lastService=="color" \|\| lastService=="perm") | 来店前確認の連絡を送付し、必要ならパッチテスト枠を予約案に追加 |
| KT-04 | 乾燥肌客への季節性保湿メニュー提案 | 中 | skinType=="dry" && cycleOverdueRatio>=1.0 && daysToAnniversary<=30 | 記念日特典付きの保湿メニュー提案を作成し、来店サイクル提案アラートと併せて送付 |
| KT-05 | パーマ毛のリッジ持続ケア＆次回タイミング提案 | 中 | lastService=="perm" && daysSinceLastVisit>=50 && daysSinceLastVisit<=90 && hasUpcomingReservation==false | 次回パーマの予約サイクル提案アラートを発行し、カール持続ケアのアドバイスを添えて連絡 |
| KT-06 | 脂性肌×店販比率低めの頭皮ケア商品クロスセル | 中 | skinType=="oily" && retailRatio<0.1 && visitCount>=3 | 次回来店時の頭皮/皮脂ケア商品提案をスタッフ向けメモに登録し、サンプル配布を計画 |
| KT-07 | ブリーチ/ハイトーン毛のホームケア徹底フォロー | 高 | lastService=="bleach" && hairType=="damaged" && daysSinceLastVisit<=14 | 施術後アフターフォローのメッセージを送付し、専用ホームケア商品の案内を添付 |
| KT-08 | 施術履歴空白×超過客への次回メニュー再設計提案 | 低 | lastService==null && daysSinceLastVisit>120 && status=="dormant" | カルテ更新を兼ねたヒアリング連絡を送付し、再来店向けの新規メニュー提案を作成 |
| KT-09 | VIP×ダメージ毛への上位プレミアムケアの個別提案 | 高 | rfmSegment=="VIP" && hairType=="damaged" && cycleOverdueRatio>=0.8 | 指名スタッフ名義でプレミアムケアの個別提案を作成し、来店サイクル提案アラートと併せて優先連絡 |
| KT-10 | 梅雨・湿気シーズンの髪質別うねり対策メニュー案内 | 中 | (hairType=="wavy" \|\| hairType=="frizzy") && daysToAnniversary>30 && cycleOverdueRatio>=0.9 && status=="repeat" | 季節限定のうねり対策メニュー提案を作成し、来店サイクル提案アラートに季節訴求を添えて送付 |

## VIP・上位顧客ロイヤルティ

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| VIP-01 | VIP顧客の優先予約枠を確保 | 高 | rfmSegment=="VIP" && hasUpcomingReservation==false && consentToContact==true | 優先予約枠の確保通知を発行し、担当スタッフ指名でLINE/メール送付。ワンクリックで予約案を作成。 |
| VIP-02 | 高LTV顧客への来店周期アラート | 高 | ltv>=300000 && cycleOverdueRatio>=1.2 && hasUpcomingReservation==false | 来店サイクル提案アラートを発行し、予測日前後の予約案を自動作成。担当より個別連絡文を送付。 |
| VIP-03 | VIP限定クーポンの先行配布 | 中 | (rfmSegment=="VIP" \|\| rfmSegment=="Loyal") && rfmFrequency>=4 && consentToContact==true | VIP限定クーポン付きLINE/メールを一般配信より前に先行送付。利用期限と優待内容を明記。 |
| VIP-04 | 上位客単価顧客にプレミアムメニュー提案 | 中 | avgSpend>=15000 && rfmMonetary>=4 && hasUpcomingReservation==true | 次回メニュー提案を予約詳細に紐付け、来店前リマインドにプレミアムメニュー案内を添えて送付。 |
| VIP-05 | VIP顧客の記念日サプライズ優待 | 中 | (rfmSegment=="VIP" \|\| rfmSegment=="Loyal") && (daysToBirthday<=14 \|\| daysToAnniversary<=14) && consentToContact==true | 記念日サプライズ優待（特別メニュー/プレゼント付き）を発行し、記念日2週間前にLINE/メール送付。 |
| VIP-06 | VIP顧客の店販クロスセル提案 | 低 | rfmSegment=="VIP" && retailRatio<0.1 && visitCount>=5 | 次回来店時の店販クロスセル提案をカルテに登録し、髪質・肌質に基づくおすすめ商品リストを担当へ共有。 |
| VIP-07 | 離反兆候VIPへの最優先ウィンバック | 高 | (rfmSegment=="VIP" \|\| rfmSegment=="Loyal") && daysSinceLastVisit>120 && cycleOverdueRatio>=1.5 && hasUpcomingReservation==false | 最優先ウィンバックアラートを発行し、担当スタッフ指名で特別オファー付きの個別連絡文を送付。電話/LINEで直接フォロー。 |
| VIP-08 | VIP紹介・口コミ特典の依頼 | 低 | rfmSegment=="VIP" && reviewGiven==true && referralCount<2 && consentToContact==true | 紹介特典付きの依頼メッセージを送付し、紹介コード/クーポンを発行。referralCountを追跡。 |

## 紹介・口コミ促進

| ID | タイトル | 優先度 | トリガ条件 | 推奨アクション |
|---|---|---|---|---|
| RF-01 | VIP常連へのレビュー依頼（未投稿） | 高 | rfmSegment=="VIP" && reviewGiven==false && visitCount>=5 && consentToContact==true | 口コミ投稿リンク付きのお礼メッセージをLINE/メールで送付。投稿確認後にreviewGiven=trueへ更新する運用フローを設定。 |
| RF-02 | 施術直後の満足ピークでレビュー依頼 | 高 | reviewGiven==false && daysSinceLastVisit<=3 && status=="repeat" && consentToContact==true | 来店翌日〜3日以内に自動でアフターフォローメッセージ＋レビューリンクを送付。返信があれば施術満足度をnotesに記録。 |
| RF-03 | 高LTV満足顧客への紹介依頼 | 高 | ltv>=200000 && visitCount>=8 && cycleOverdueRatio<1.0 && consentToContact==true | 紹介特典（双方割引/トリートメント無料）付きの紹介カードまたはデジタル紹介リンクを送付。紹介発生時にreferralCountを加算。 |
| RF-04 | リピーター化した新規顧客への口コミ依頼 | 中 | reviewGiven==false && visitCount>=2 && visitCount<=4 && status=="repeat" && consentToContact==true | 2〜3回目来店の会計後にレビュー依頼メッセージを送付。来店動機（何で知ったか）を尋ねる一文を添えて流入分析にも活用。 |
| RF-05 | 店販ファンへの口コミ・SNS拡散依頼 | 中 | retailRatio>=0.2 && retailPurchaseCount>=3 && reviewGiven==false && consentToContact==true | 愛用商品のレビュー依頼＋SNSタグ付け特典の案内を送付。投稿確認後に来店時特典を付与し、リピート購入クーポンも併せて提示。 |
| RF-06 | 実績ある紹介者へのリピート紹介依頼 | 中 | referralCount>=1 && cycleOverdueRatio<1.2 && consentToContact==true && rfmFrequency>=3 | 前回紹介へのお礼を兼ねた再紹介依頼メッセージと累計紹介特典（ランクアップ特典）を送付。紹介数に応じた特典テーブルを案内。 |
| RF-07 | 記念日タイミングでの感謝＋紹介・口コミ依頼 | 低 | daysToAnniversary<=14 && visitCount>=6 && consentToContact==true && reviewGiven==false | 記念日前に感謝メッセージ＋記念日特典クーポンを送付し、文中に口コミ・紹介リンクを併設。次回来店アラートと連動させる。 |
