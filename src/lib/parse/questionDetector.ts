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

// 推断题型
export function inferType(
  stem: string,
  options: Option[],
  answer: string,
  typeHint?: string,
): { type: QuestionType; confidence: number } {
  // 有选项 → 单选或多选
  if (options.length >= 2) {
    const ansLetters = answer.toUpperCase().replace(/[^A-Z]/g, '')
    if (ansLetters.length > 1 || typeHint?.includes('多选')) {
      return { type: QuestionType.MultipleChoice, confidence: 0.9 }
    }
    return { type: QuestionType.SingleChoice, confidence: 0.9 }
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
