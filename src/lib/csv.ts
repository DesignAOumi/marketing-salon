/**
 * 依存追加なしの最小 CSV ユーティリティ（RFC 4180 準拠）。
 *  - フィールドにカンマ・改行・ダブルクォートを含む場合は "…" で囲み、" は "" にエスケープ。
 *  - parse は先頭行をヘッダとしてオブジェクト配列を返す。BOM は除去。
 */

function escapeField(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** ヘッダ配列＋行オブジェクト配列 → CSV 文字列（CRLF 区切り）。 */
export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.map(escapeField).join(",")];
  for (const r of rows) lines.push(headers.map((h) => escapeField(r[h])).join(","));
  return lines.join("\r\n");
}

/** CSV 文字列 → 2次元配列（クォート・改行・エスケープ対応）。 */
export function parseCsvRows(input: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM 除去
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  let sawAny = false;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      sawAny = true;
      i++;
    } else if (ch === ",") {
      row.push(field);
      field = "";
      sawAny = true;
      i++;
    } else if (ch === "\r") {
      i++;
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      sawAny = false;
      i++;
    } else {
      field += ch;
      sawAny = true;
      i++;
    }
  }
  if (sawAny || field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** CSV 文字列 → オブジェクト配列（1行目＝ヘッダ）。空行はスキップ。 */
export function parseCsv(input: string): Record<string, string>[] {
  const rows = parseCsvRows(input).filter((r) => !(r.length === 1 && r[0] === ""));
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}
