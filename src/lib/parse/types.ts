import type { QuestionType } from '@/types'
import type { Option } from '@/types'

export interface ParsedQuestion {
  tempId: string
  type?: QuestionType
  stem: string
  options: Option[]
  answer: string
  analysis: string
  knowledgePoint: string
  order: number
  confidence: number
  needsReview: boolean
  warnings: string[]
  // ── 分空选择题专用（可选，不入库）──
  parentGroupId?: string   // 同一父题的所有子空共享同一 nanoid
  blankLabel?: string      // 如 "第1空" / "(1)" / "17-1"，用于评审表展示
  blankIndex?: number      // 空号数字（1,2,3...），用于排序/匹配汇总
}

export interface ParseResult {
  questions: ParsedQuestion[]
  unparsedText: string
  stats: {
    total: number
    needsReview: number
    byType: Record<string, number>
  }
}

export type ProgressCb = (ratio: number) => void
