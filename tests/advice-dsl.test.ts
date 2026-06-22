import { describe, it, expect } from "vitest";
import { evalRuleString, parseRule } from "../src/lib/advice-dsl";
import catalog from "../data/advice-catalog.json";

const T = { today: 20000 };

describe("advice DSL engine (§C, missing-safe)", () => {
  it("comparison + logical AND", () => {
    expect(evalRuleString("a>=1 && b==true", { ...T, a: 2, b: true })).toBe(true);
    expect(evalRuleString("a>=1 && b==true", { ...T, a: 0, b: true })).toBe(false);
  });

  it("missing field → false (no throw)", () => {
    expect(evalRuleString("a>1", { ...T })).toBe(false);
  });

  it("in operator", () => {
    expect(evalRuleString('x in ["a","b"]', { ...T, x: "a" })).toBe(true);
    expect(evalRuleString('x in ["a","b"]', { ...T, x: "c" })).toBe(false);
  });

  it("between operator", () => {
    expect(evalRuleString("age between 30 and 50", { ...T, age: 40 })).toBe(true);
    expect(evalRuleString("age between 30 and 50", { ...T, age: 60 })).toBe(false);
  });

  it("date arithmetic with today", () => {
    expect(evalRuleString("d<=today+7 && d>=today", { today: 100, d: 103 })).toBe(true);
    expect(evalRuleString("d<=today+7 && d>=today", { today: 100, d: 120 })).toBe(false);
  });

  it("multiplication", () => {
    expect(evalRuleString("x>=y*0.8", { ...T, x: 25, y: 30 })).toBe(true);
    expect(evalRuleString("x>=y*0.8", { ...T, x: 20, y: 30 })).toBe(false);
  });

  it(".length on arrays", () => {
    expect(evalRuleString("arr.length>0", { ...T, arr: ["x"] })).toBe(true);
    expect(evalRuleString("arr.length>0", { ...T, arr: [] })).toBe(false);
  });

  it("null existence (x != null)", () => {
    expect(evalRuleString("p!=null", { ...T, p: "x" })).toBe(true);
    expect(evalRuleString("p!=null", { ...T, p: null })).toBe(false);
  });

  it("or + parentheses precedence", () => {
    expect(evalRuleString("(a==1 || b==2) && c==3", { ...T, a: 9, b: 2, c: 3 })).toBe(true);
    expect(evalRuleString("(a==1 || b==2) && c==3", { ...T, a: 9, b: 9, c: 3 })).toBe(false);
  });

  it("複数値フィールド: == は配列メンバーシップ（いずれか一致）", () => {
    // 髪質・肌質・アレルギー等は配列。hairType=="くせ毛" は「含む」を意味する。
    expect(evalRuleString('hairType=="くせ毛"', { ...T, hairType: ["くせ毛", "乾燥毛"] })).toBe(true);
    expect(evalRuleString('hairType=="直毛"', { ...T, hairType: ["くせ毛", "乾燥毛"] })).toBe(false);
    expect(evalRuleString('hairType!="直毛"', { ...T, hairType: ["くせ毛", "乾燥毛"] })).toBe(true);
    // 単一値(文字列)は従来どおり厳密一致
    expect(evalRuleString('g=="female"', { ...T, g: "female" })).toBe(true);
  });

  it("複数値フィールド: in は集合の交差", () => {
    expect(evalRuleString('skinType in ["敏感肌","脂性"]', { ...T, skinType: ["乾燥", "敏感肌"] })).toBe(true);
    expect(evalRuleString('skinType in ["敏感肌","脂性"]', { ...T, skinType: ["乾燥", "普通"] })).toBe(false);
  });

  it("all 110 catalog rules parse without error", () => {
    for (const item of catalog.items) {
      expect(() => parseRule(item.triggerRule), item.id).not.toThrow();
    }
  });
});
