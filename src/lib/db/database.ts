import Dexie, { type Table } from 'dexie'
import type {
  QuestionBank,
  Question,
  PracticeRecord,
  WrongQuestion,
  Settings,
} from '@/types'

class ExamDB extends Dexie {
  banks!: Table<QuestionBank, string>
  questions!: Table<Question, string>
  practiceRecords!: Table<PracticeRecord, string>
  wrongQuestions!: Table<WrongQuestion, string>
  settings!: Table<Settings, string>

  constructor() {
    super('ExamPracticeDB')
    this.version(1).stores({
      // 注：IndexedDB 不能可靠索引 boolean，故 isCorrect / mastered 不入索引，
      // 相关查询先按 bankId 取再内存过滤。
      banks: 'id, name, createdAt, updatedAt',
      questions: 'id, bankId, type, order, [bankId+order]',
      practiceRecords:
        'id, questionId, bankId, practicedAt, sessionType, [bankId+practicedAt]',
      wrongQuestions: 'id, questionId, bankId, addedAt, lastWrongAt',
      settings: 'id',
    })
    // v2: Question 增加 knowledgePoint 字段（仅 schema 声明变化，无需迁移数据，
    // IndexedDB 是 schemaless，旧数据读取时该字段为 undefined，新写入正常）
    this.version(2).stores({
      banks: 'id, name, createdAt, updatedAt',
      questions: 'id, bankId, type, order, [bankId+order]',
      practiceRecords:
        'id, questionId, bankId, practicedAt, sessionType, [bankId+practicedAt]',
      wrongQuestions: 'id, questionId, bankId, addedAt, lastWrongAt',
      settings: 'id',
    })
  }
}

export const db = new ExamDB()
