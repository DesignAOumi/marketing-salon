/**
 * 導入セットアップの進捗を「実データから自動判定」する（ダッシュボード表示用）。Node 専用。
 * 各項目の done はDB/設定の実状態から計算するため、作業を進めると自動で✓に変わる。
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export type SetupItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  required: boolean;
  done: boolean;
  detail: string;
};

export type SetupStatus = {
  items: SetupItem[];
  requiredTotal: number;
  requiredDone: number;
  optionalTotal: number;
  optionalDone: number;
  percent: number; // 必須項目の達成率
};

export async function getSetupStatus(): Promise<SetupStatus> {
  const [settings, customerCount, visitCount, saleCount, reservationCount, cycleCount, consentCount, staffCount] =
    await Promise.all([
      getSettings(),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.visit.count(),
      prisma.sale.count(),
      prisma.reservation.count(),
      prisma.customer.count({ where: { deletedAt: null, avgVisitIntervalDays: { not: null } } }),
      prisma.customer.count({ where: { deletedAt: null, consentToContact: true } }),
      prisma.staff.count({ where: { isActive: true } }),
    ]);

  const salonConfigured = !!settings.salonName && settings.salonName !== "My Salon";
  const aiConnected = settings.aiMode === "connected" && !!settings.encryptedApiKey;

  const items: SetupItem[] = [
    {
      key: "admin",
      title: "管理者アカウントを作成",
      description: "ログイン用の管理者(owner)。初回ログイン後はパスワードを変更してください。",
      href: "/settings",
      required: true,
      done: staffCount > 0,
      detail: staffCount > 0 ? "作成済み" : "未作成",
    },
    {
      key: "salon",
      title: "サロン情報を設定",
      description: "サロン名・連絡先・タイムゾーン・通貨を登録します。",
      href: "/settings",
      required: true,
      done: salonConfigured,
      detail: salonConfigured ? settings.salonName : "未設定（既定のまま）",
    },
    {
      key: "customers",
      title: "顧客を登録",
      description: "顧客カルテを作成します（手入力 / CSVインポート）。",
      href: "/customers",
      required: true,
      done: customerCount > 0,
      detail: `${customerCount} 名`,
    },
    {
      key: "visits",
      title: "施術履歴（来店）を記録",
      description: "来店を記録すると来店サイクルが算出されます。",
      href: "/customers",
      required: true,
      done: visitCount > 0,
      detail: `${visitCount} 件`,
    },
    {
      key: "sales",
      title: "売上を記録",
      description: "会計を記録すると客単価・LTV・分析が有効になります。",
      href: "/customers",
      required: true,
      done: saleCount > 0,
      detail: `${saleCount} 件`,
    },
    {
      key: "cycle",
      title: "来店サイクルが算出された",
      description: "2回以上来店の顧客で平均来店間隔・次回予測日が算出されます（M3/M6 の前提）。",
      href: "/analytics",
      required: false,
      done: cycleCount > 0,
      detail: `${cycleCount} 名`,
    },
    {
      key: "reservations",
      title: "予約を登録",
      description: "予約を登録すると「先の予約有無」判定・ICS出力が使えます。",
      href: "/reservations",
      required: false,
      done: reservationCount > 0,
      detail: `${reservationCount} 件`,
    },
    {
      key: "consent",
      title: "連絡同意を取得",
      description: "連絡同意のある顧客が再来店提案(M6)・連絡文の対象になります。",
      href: "/customers",
      required: false,
      done: consentCount > 0,
      detail: `${consentCount} 名`,
    },
    {
      key: "ai",
      title: "AI連携を設定（任意）",
      description: "Claude APIキーを登録すると個別化アドバイスが使えます（既定はオフライン・外部送信ゼロ）。",
      href: "/settings",
      required: false,
      done: aiConnected,
      detail: aiConnected ? `連携あり / ${settings.aiModel ?? ""}` : "オフライン（既定）",
    },
  ];

  const required = items.filter((i) => i.required);
  const optional = items.filter((i) => !i.required);
  const requiredDone = required.filter((i) => i.done).length;
  const optionalDone = optional.filter((i) => i.done).length;

  return {
    items,
    requiredTotal: required.length,
    requiredDone,
    optionalTotal: optional.length,
    optionalDone,
    percent: required.length ? Math.round((requiredDone / required.length) * 100) : 100,
  };
}
