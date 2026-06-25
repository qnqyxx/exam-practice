import { QuestionType } from '@/types/enums'
import type { Option } from '@/types'
import {
  RE_OPTION,
  RE_ANSWER,
  RE_ANSWER_INLINE,
  RE_ANALYSIS,
  RE_KNOWLEDGE,
  RE_TRUEFALSE_ANSWER,
  RE_BLANK,
  TRUE_TOKENS,
  FALSE_TOKENS,
} from './patterns'

// 规范化答案
export function normalizeAnswer(raw: string, type?: QuestionType): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  if (type === QuestionType.TrueFalse) {
    return normalizeTrueFalse(trimmed)
  }

  if (type === QuestionType.MultipleChoice || type === QuestionType.SingleChoice) {
    // 提取所有字母，去重，升序
    const letters = trimmed
      .toUpperCase()
      .split(/[^A-Z]/)
      .filter(Boolean)
    const unique = [...new Set(letters)].sort().join('')
    return unique
  }

  return trimmed
}

export function normalizeTrueFalse(raw: string): string {
  const t = raw.trim().toUpperCase()
  if (TRUE_TOKENS.has(t.toLowerCase()) || TRUE_TOKENS.has(t)) return 'T'
  if (FALSE_TOKENS.has(t.toLowerCase()) || FALSE_TOKENS.has(t)) return 'F'
  // 长文本里找关键词
  if (/(正确|对|√)/.test(raw)) return 'T'
  if (/(错误|错|×)/.test(raw)) return 'F'
  return raw.trim()
}

// 推断题型（增强版）
export function inferType(
  stem: string,
  options: Option[],
  answer: string,
  typeHint?: string,
): { type: QuestionType; confidence: number } {
  // ── 多选检测优先级最高 ──

  // 1) 题型小标题明确说"多选"→ 直接多选
  if (typeHint?.includes('多选')) {
    return { type: QuestionType.MultipleChoice, confidence: 0.95 }
  }

  // 2) 题干直接标注"多选"（如"（多选）"、"(多选题)"、"本题多选"）
  if (/[（(]\s*多选(题)?\s*[)）]|多选题|本题多选|属于多选/.test(stem)) {
    return { type: QuestionType.MultipleChoice, confidence: 0.95 }
  }

  // 3) 题干包含典型多选题型句式
  //    注意：只匹配明确的多选题提问模式，避免"多个用户""哪些功能"等描述性语言误触
  const multiChoiceStemPatterns =
    /(?:下列|以下)\s*(?:哪些|几项|几条)|多(?:项)?[选题]|(?:正确的?|不正确的?|错误的?)\s*(?:有(?:哪些|几项|几条)?|的是|包括)/
  const stemIsMulti = multiChoiceStemPatterns.test(stem)

  // 4) 有选项时，综合判断
  if (options.length >= 2) {
    const ansLetters = answer.toUpperCase().replace(/[^A-Z]/g, '')

    // 答案字母数 >1 → 几乎确定是多选（最可靠信号）
    if (ansLetters.length > 1) {
      return { type: QuestionType.MultipleChoice, confidence: 0.93 }
    }

    // 题干有多选关键词 → 倾向多选
    if (stemIsMulti) {
      return { type: QuestionType.MultipleChoice, confidence: 0.82 }
    }

    // 选项文本中含"以上都对/以下都对/全部正确/AB都对"等多选标志
    const optionTexts = options.map((o) => o.text).join(' ')
    if (/全[对正]|以上都|以下都|都正确|均正确|两项?都|二者都/.test(optionTexts)) {
      return { type: QuestionType.MultipleChoice, confidence: 0.85 }
    }

    // 默认单选（置信度中等，因为可能误判）
    return { type: QuestionType.SingleChoice, confidence: 0.7 }
  }

  // 判断题
  if (
    RE_TRUEFALSE_ANSWER.test(answer.trim()) ||
    typeHint?.includes('判断') ||
    /(是否正确|对还是错|判断)/.test(stem)
  ) {
    return { type: QuestionType.TrueFalse, confidence: 0.85 }
  }

  // 填空题
  if (RE_BLANK.test(stem) || typeHint?.includes('填空')) {
    return { type: QuestionType.FillBlank, confidence: 0.8 }
  }

  // 兜底：简答/填空
  return { type: QuestionType.FillBlank, confidence: 0.4 }
}

// 解析选项行
export function parseOptionLine(line: string): { key: string; text: string } | null {
  const m = line.match(RE_OPTION)
  if (!m) return null
  return { key: m[1].toUpperCase(), text: m[2].trim() }
}

// 判断是否为答案行
export function matchAnswerLine(line: string): string | null {
  const m = line.match(RE_ANSWER)
  if (m) return m[1].trim()
  return null
}

// 判断是否为解析行
export function matchAnalysisLine(line: string): string | null {
  const m = line.match(RE_ANALYSIS)
  if (m) return m[1].trim()
  return null
}

// 判断是否为知识点行
export function matchKnowledgeLine(line: string): string | null {
  const m = line.match(RE_KNOWLEDGE)
  if (m) return m[1].trim()
  return null
}

// 从文本中提取内联答案
export function findInlineAnswer(text: string): string | null {
  const m = text.match(RE_ANSWER_INLINE)
  if (m) return m[1].trim()
  return null
}

// 检测题型小标题提示
export function detectTypeHint(line: string): string | null {
  const m = line.match(/(单选|多选|判断|填空|简答|名词解释|论述)/)
  return m ? m[1] : null
}
