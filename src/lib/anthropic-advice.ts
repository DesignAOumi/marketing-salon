/**
 * 連携ありモード（Claude BYO）。Node 専用・サーバーサイドからのみ呼び出す（APIキーをブラウザに出さない）。
 * spec §6.5 / FR-AI-03〜08:
 *  - 送信フィールドはホワイトリスト（settings.aiSharedFields）に限定、PII 既定OFF。
 *  - anonymizeBeforeSend 時は氏名を {{NAME}} に置換して送信し、生成後にローカルで実名へ戻す。
 *  - 一致カタログをグラウンディングに使用。失敗時は null を返し連携なしへフォールバック（呼び出し側）。
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getSettings, getDecryptedApiKey, DEFAULT_SHARED_FIELDS } from "@/lib/settings";
import { getCustomerById } from "@/lib/customers";
import { buildAllContexts, getAdviceForCustomer, type Advice } from "@/lib/advice";

const SYSTEM_PROMPT = `あなたは日本の美容サロンの運営を支援するアシスタントです。
提供された顧客データと「参考アドバイス（検証済みカタログ）」を踏まえ、その顧客向けに個別最適化した連絡文を作成します。
制約:
- 医療的な断定、過度な販売圧、誇大表現を避ける。
- 顧客の宛名は提供された name の値をそのまま使う（値が {{NAME}} の場合は出力にも {{NAME}} と記載する）。
- customerMessage は敬体・自然な日本語で、そのまま送れる完成度にする。

出力は次の3キーを持つ JSON オブジェクトのみ（前後に説明やコードフェンスを付けない）:
{"insight": "サロン向けの気づき", "recommendedAction": "推奨アクション", "customerMessage": "顧客向け連絡文(敬体)"}`;

/** モデル応答テキストから JSON オブジェクトを安全に抽出。 */
function extractJson(text: string): { insight: string; recommendedAction: string; customerMessage: string } | null {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    const o = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof o.insight === "string" && typeof o.recommendedAction === "string" && typeof o.customerMessage === "string") {
      return o;
    }
    return null;
  } catch {
    return null;
  }
}

export type ConnectedAdvice = Advice & {
  generated: true;
  model: string;
  sentFields: string[];
};

/** 連携あり生成。条件未充足・失敗時は null（呼び出し側で連携なしにフォールバック）。 */
export async function generateConnectedAdvice(customerId: string): Promise<ConnectedAdvice | null> {
  const settings = await getSettings();
  if (settings.aiMode !== "connected") return null;

  const apiKey = await getDecryptedApiKey();
  if (!apiKey) return null;

  const customer = await getCustomerById(customerId);
  if (!customer || !customer.consentToContact) return null;

  const contexts = await buildAllContexts();
  const cc = contexts.get(customerId);
  if (!cc) return null;

  const allowed = settings.aiSharedFields
    ? (JSON.parse(settings.aiSharedFields) as string[])
    : DEFAULT_SHARED_FIELDS;

  // 送信ペイロード：ホワイトリストのフィールドのみ（PII除外）＋ 宛名（匿名化制御）。
  const payload: Record<string, unknown> = {};
  for (const f of allowed) {
    const v = cc.ctx[f];
    if (v !== null && v !== undefined) payload[f] = v;
  }
  payload.name = settings.anonymizeBeforeSend ? "{{NAME}}" : customer.name;

  // グラウンディング：一致した連携なしアドバイス（検証済み）。
  const offline = await getAdviceForCustomer(customerId, 3);
  const grounding = offline.map((a) => ({ title: a.title, insight: a.insight, action: a.recommendedAction }));

  const model = settings.aiModel || "claude-opus-4-8";
  const sentFields = Object.keys(payload);

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            "次の顧客データと参考アドバイスを踏まえ、この顧客向けの連絡文を作成してください。\n\n" +
            `# 顧客データ\n${JSON.stringify(payload, null, 2)}\n\n` +
            `# 参考アドバイス（検証済みカタログ）\n${JSON.stringify(grounding, null, 2)}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const parsed = extractJson(textBlock.text);
    if (!parsed) return null;

    // 匿名化していた場合、生成結果の {{NAME}} を実名へローカルで戻す。
    const customerMessage = settings.anonymizeBeforeSend
      ? parsed.customerMessage.replaceAll("{{NAME}}", customer.name)
      : parsed.customerMessage;

    // 監査ログ（本文PIIは保存しない：FR-AI-08）。
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.adviceLog.create({
        data: {
          customerId,
          mode: "ai",
          model,
          message: "(AI生成・本文は監査ログに保存しない)",
          triggerSnapshot: JSON.stringify({ sentFields }),
          status: "shown",
        },
      });
    } catch {
      /* ログ失敗は致命としない */
    }

    return {
      id: "AI",
      category: "連携あり生成",
      title: "AIパーソナライズ連絡文",
      priority: "high",
      insight: parsed.insight,
      recommendedAction: parsed.recommendedAction,
      customerMessage,
      generated: true,
      model,
      sentFields,
    };
  } catch {
    return null; // フォールバック（連携なし）
  }
}

/** 接続テスト（FR-M0-07）。キーで小さなリクエストを投げ、成否を返す。 */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  const apiKey = await getDecryptedApiKey();
  if (!apiKey) return { ok: false, message: "APIキーが未登録です。" };
  const settings = await getSettings();
  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: settings.aiModel || "claude-opus-4-8",
      max_tokens: 8,
      messages: [{ role: "user", content: "ping" }],
    });
    return { ok: true, message: "接続成功。APIキーは有効です。" };
  } catch (e) {
    return { ok: false, message: "接続失敗: " + (e instanceof Error ? e.message : String(e)) };
  }
}
