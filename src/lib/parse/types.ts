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
