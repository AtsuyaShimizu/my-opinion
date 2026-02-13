import type { AttributeInference } from "@/types/database";

const POSITIVE_HINTS = ["賛成", "支持", "必要", "推進", "賛同", "良い", "評価"];
const NEGATIVE_HINTS = ["反対", "不要", "問題", "批判", "懸念", "悪い", "疑問"];

export function inferStanceScoreFromText(text: string): number {
  let score = 50;
  for (const word of POSITIVE_HINTS) {
    if (text.includes(word)) score += 8;
  }
  for (const word of NEGATIVE_HINTS) {
    if (text.includes(word)) score -= 8;
  }
  return Math.max(0, Math.min(100, score));
}

export function inferAttributesFromText(text: string): {
  inferred: AttributeInference[] | null;
  confidence: number | null;
} {
  void text;
  // 初期実装では推定属性を断定せず、空で返す。
  // 将来ここにモデル推定を追加する。
  return {
    inferred: null,
    confidence: null,
  };
}
