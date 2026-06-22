/**
 * 連携なしモードのトリガDSL 評価エンジン（純粋・サンドボックス）。
 * advice-catalog の triggerRule 文字列を安全にパース/評価する（eval を使わない / §6.3）。
 *
 * 文法:
 *   or   := and ('||' and)*
 *   and  := primary ('&&' primary)*
 *   primary := '(' or ')' | comparison
 *   comparison := operand ( 'in' array | 'between' operand 'and' operand | cmpOp operand )
 *   operand := atom (('+'|'-') atom)*           // today+7 等の日数演算
 *   atom := number | string | true | false | today | field['.length']
 *   array := '[' (atom (',' atom)*)? ']'
 *
 * 欠損安全（§C.2）: null/未定義の比較は false を返す（例外を投げない）。
 */

export type AdviceContext = Record<string, unknown> & { today: number };

type Operand =
  | { type: "num"; v: number }
  | { type: "str"; v: string }
  | { type: "bool"; v: boolean }
  | { type: "today" }
  | { type: "null" }
  | { type: "field"; name: string; length?: boolean }
  | { type: "add"; op: "+" | "-" | "*" | "/"; left: Operand; right: Operand };

export type AdviceNode =
  | { type: "and"; items: AdviceNode[] }
  | { type: "or"; items: AdviceNode[] }
  | { type: "cmp"; op: string; left: Operand; right: Operand }
  | { type: "in"; left: Operand; values: Operand[] }
  | { type: "between"; left: Operand; min: Operand; max: Operand };

type Token = { t: string; v?: string | number };

function tokenize(src: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
  const isIdent = (c: string) => /[A-Za-z0-9_]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      let s = "";
      while (j < src.length && src[j] !== quote) {
        s += src[j];
        j++;
      }
      toks.push({ t: "str", v: s });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let j = i;
      let s = "";
      while (j < src.length && /[0-9.]/.test(src[j])) {
        s += src[j];
        j++;
      }
      toks.push({ t: "num", v: parseFloat(s) });
      i = j;
      continue;
    }
    if (isIdentStart(c)) {
      let j = i;
      let s = "";
      while (j < src.length && isIdent(src[j])) {
        s += src[j];
        j++;
      }
      toks.push({ t: "ident", v: s });
      i = j;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
      toks.push({ t: two });
      i += 2;
      continue;
    }
    if ("><+-*/()[],.".includes(c)) {
      toks.push({ t: c });
      i++;
      continue;
    }
    throw new Error(`字句解析エラー: 不正な文字 '${c}'`);
  }
  toks.push({ t: "eof" });
  return toks;
}

export function parseRule(src: string): AdviceNode {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expect = (t: string) => {
    if (toks[p].t !== t) throw new Error(`構文エラー: '${t}' を期待 (実際 '${toks[p].t}')`);
    return toks[p++];
  };

  function parseAtom(): Operand {
    const t = next();
    if (t.t === "num") return { type: "num", v: t.v as number };
    if (t.t === "str") return { type: "str", v: t.v as string };
    if (t.t === "ident") {
      const name = t.v as string;
      if (name === "true") return { type: "bool", v: true };
      if (name === "false") return { type: "bool", v: false };
      if (name === "null") return { type: "null" };
      if (name === "today") return { type: "today" };
      if (peek().t === ".") {
        next();
        const prop = expect("ident");
        if (prop.v !== "length") throw new Error(`.${String(prop.v)} は未対応`);
        return { type: "field", name, length: true };
      }
      return { type: "field", name };
    }
    throw new Error(`オペランドを期待 (実際 '${t.t}')`);
  }

  function parseMul(): Operand {
    let node = parseAtom();
    while (peek().t === "*" || peek().t === "/") {
      const op = next().t as "*" | "/";
      node = { type: "add", op, left: node, right: parseAtom() };
    }
    return node;
  }

  function parseOperand(): Operand {
    let node = parseMul();
    while (peek().t === "+" || peek().t === "-") {
      const op = next().t as "+" | "-";
      node = { type: "add", op, left: node, right: parseMul() };
    }
    return node;
  }

  function parseArray(): Operand[] {
    expect("[");
    const vals: Operand[] = [];
    if (peek().t !== "]") {
      vals.push(parseAtom());
      while (peek().t === ",") {
        next();
        vals.push(parseAtom());
      }
    }
    expect("]");
    return vals;
  }

  function parseComparison(): AdviceNode {
    const left = parseOperand();
    const t = peek();
    if (t.t === "ident" && t.v === "in") {
      next();
      return { type: "in", left, values: parseArray() };
    }
    if (t.t === "ident" && t.v === "between") {
      next();
      const min = parseOperand();
      const a = next();
      if (!(a.t === "ident" && a.v === "and")) throw new Error("between: 'and' を期待");
      const max = parseOperand();
      return { type: "between", left, min, max };
    }
    if ([">=", "<=", "==", "!=", ">", "<"].includes(t.t)) {
      next();
      return { type: "cmp", op: t.t, left, right: parseOperand() };
    }
    throw new Error(`比較演算子を期待 (実際 '${t.t}')`);
  }

  function parsePrimary(): AdviceNode {
    if (peek().t === "(") {
      next();
      const n = parseOr();
      expect(")");
      return n;
    }
    return parseComparison();
  }

  function parseAnd(): AdviceNode {
    const items = [parsePrimary()];
    while (peek().t === "&&") {
      next();
      items.push(parsePrimary());
    }
    return items.length > 1 ? { type: "and", items } : items[0];
  }

  function parseOr(): AdviceNode {
    const items = [parseAnd()];
    while (peek().t === "||") {
      next();
      items.push(parseAnd());
    }
    return items.length > 1 ? { type: "or", items } : items[0];
  }

  const ast = parseOr();
  if (peek().t !== "eof") throw new Error(`余分なトークン: '${peek().t}'`);
  return ast;
}

function evalOperand(node: Operand, ctx: AdviceContext): unknown {
  switch (node.type) {
    case "num":
    case "str":
    case "bool":
      return node.v;
    case "today":
      return ctx.today;
    case "null":
      return null;
    case "field": {
      const val = ctx[node.name];
      if (node.length) return Array.isArray(val) ? val.length : 0;
      return val === undefined ? null : val;
    }
    case "add": {
      const l = evalOperand(node.left, ctx);
      const r = evalOperand(node.right, ctx);
      if (typeof l !== "number" || typeof r !== "number") return null;
      switch (node.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          return r === 0 ? null : l / r;
      }
    }
  }
  return null;
}

export function evaluateRule(ast: AdviceNode, ctx: AdviceContext): boolean {
  switch (ast.type) {
    case "and":
      return ast.items.every((n) => evaluateRule(n, ctx));
    case "or":
      return ast.items.some((n) => evaluateRule(n, ctx));
    case "cmp": {
      const l = evalOperand(ast.left, ctx);
      const r = evalOperand(ast.right, ctx);
      // `x != null` / `x == null` は存在判定（欠損安全ルールより優先）
      if (ast.left.type === "null" || ast.right.type === "null") {
        const other = ast.right.type === "null" ? l : r;
        const isNull = other === null || other === undefined;
        if (ast.op === "==") return isNull;
        if (ast.op === "!=") return !isNull;
        return false;
      }
      if (l === null || l === undefined || r === null || r === undefined) return false;
      switch (ast.op) {
        // 複数値（配列）フィールドは「いずれかが一致」を意味する（hairType=="くせ毛" 等）。
        case "==":
          return Array.isArray(l) ? l.includes(r) : l === r;
        case "!=":
          return Array.isArray(l) ? !l.includes(r) : l !== r;
        case ">":
          return typeof l === "number" && typeof r === "number" && l > r;
        case ">=":
          return typeof l === "number" && typeof r === "number" && l >= r;
        case "<":
          return typeof l === "number" && typeof r === "number" && l < r;
        case "<=":
          return typeof l === "number" && typeof r === "number" && l <= r;
      }
      return false;
    }
    case "in": {
      const l = evalOperand(ast.left, ctx);
      if (l === null || l === undefined) return false;
      const vals = ast.values.map((v) => evalOperand(v, ctx));
      // 配列フィールドは集合の交差（いずれかの要素が候補に含まれる）で判定。
      return Array.isArray(l) ? vals.some((v) => l.includes(v)) : vals.includes(l);
    }
    case "between": {
      const l = evalOperand(ast.left, ctx);
      const min = evalOperand(ast.min, ctx);
      const max = evalOperand(ast.max, ctx);
      if ([l, min, max].some((x) => x === null || x === undefined || typeof x !== "number")) {
        return false;
      }
      return (min as number) <= (l as number) && (l as number) <= (max as number);
    }
  }
}

/** 文字列ルールを直接評価（パースエラー時は false・例外を投げない）。 */
export function evalRuleString(src: string, ctx: AdviceContext): boolean {
  try {
    return evaluateRule(parseRule(src), ctx);
  } catch {
    return false;
  }
}
