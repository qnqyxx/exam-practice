import type { QuestionType } from './enums'

export interface Option {
  key: string // "A".."Z"
  text: string
}

export interface QuestionBank {
  id: string
  name: string
  description?: string
  tags?: string[]
  questionCount: number // 反范式化，列表展示用
  createdAt: number // epoch ms
  updatedAt: number
}

export interface Question {
  id: string
  bankId: string
  type: QuestionType
  stem: string // 题干
  options: Option[] // 单选/多选必填；判断/填空为 []
  answer: string // 规范化答案：
  //   single: "A"
  //   multiple: "ACD"（字母升序拼接）
  //   truefalse: "T" | "F"
  //   fillblank: 参考答案原文
  analysis?: string // 解析
  knowledgePoint?: string // 知识点 / 考点
  difficulty?: 1 | 2 | 3
  order: number // 题库内序号，顺序练习用
  createdAt: number
  updatedAt: number
}

export interface PracticeRecord {
  id: string
  questionId: string
  bankId: string
  isCorrect: boolean
  userAnswer: string
  durationMs?: number
  practicedAt: number // epoch ms
  sessionType: 'sequential' | 'wrongbook'
}

export interface WrongQuestion {
  id: string // 与 questionId 相同（1:1，去重方便）
  questionId: string
  bankId: string
  wrongCount: number
  mastered: boolean
  addedAt: number
  lastWrongAt: number
  lastReviewedAt?: number
}

export interface Settings {
  id: 'app' // 单例
  theme: 'light' | 'dark'
  revealMode: 'instant' | 'manual' // 默认 manual（空格揭示）
  shortcutsEnabled: boolean
  defaultBankId?: string
}

export type { QuestionType } from './enums'
