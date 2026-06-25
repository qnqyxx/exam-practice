import { QuestionType } from '@/types/enums'

// 快捷键映射
export const SHORTCUTS = {
  reveal: 'Space',
  next: 'ArrowRight',
  prev: 'ArrowLeft',
  nextAlt: 'KeyJ',
  prevAlt: 'KeyK',
  correct: 'KeyY', // 我对了
  wrong: 'KeyN', // 我错了
} as const

// 答案规范化用的字符
export const TRUE_MARKS = ['对', '正确', 'T', 'Y', '√', '是', 'true']
export const FALSE_MARKS = ['错', '错误', 'F', 'N', '×', '否', 'false']

export const QUESTION_TYPES = QuestionType
