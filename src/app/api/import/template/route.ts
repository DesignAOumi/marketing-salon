import { CUSTOMER_COLUMNS } from "@/lib/data-io";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// 顧客インポート用CSVテンプレート（正しい列見出し + 記入例2行）。Excel互換のため UTF-8 BOM 付与。
export async function GET() {
  const examples = [
    {
      id: "",
      name: "山田 花子",
      nameKana: "ヤマダ ハナコ",
      gender: "female",
      birthday: "1990-04-15",
      phone: "090-1234-5678",
      email: "hanako@example.com",
      hairType: "くせ毛",
      skinType: "敏感肌",
      allergies: "ジアミン;香料",
      preferences: "明るめのカラー希望",
      notes: "初回カウンセリング済み",
      consentToContact: "true",
    },
    {
      id: "",
      name: "佐藤 太郎",
      nameKana: "サトウ タロウ",
      gender: "male",
      birthday: "",
      phone: "080-0000-0000",
      email: "",
      hairType: "直毛",
      skinType: "",
      allergies: "",
      preferences: "",
      notes: "",
      consentToContact: "false",
    },
  ];

  const csv = "﻿" + toCsv([...CUSTOMER_COLUMNS], examples);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="customers-import-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
