import { nanoid } from 'nanoid'
import { db } from './database'
import { recountQuestions } from './banks.repo'
import type { Question, Option, QuestionType } from '@/types'

export async function listQuestionsByBank(bankId: string): Promise<Question[]> {
  return db.questions.where('[bankId+order]').between([bankId, -Infinity], [bankId, Infinity]).toArray()
}

export async function getQuestion(id: string): Promise<Question | undefined> {
  return db.questions.get(id)
}

export async function createQuestion(
  data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Question, 'id'>>,
): Promise<Question> {
  const now = Date.now()
  const q: Question = {
    ...data,
    id: data.id ?? nanoid(),
    createdAt: now,
    updatedAt: now,
  }
  await db.questions.add(q)
  await recountQuestions(q.bankId)
  return q
}

export async function bulkCreateQuestions(
  bankId: string,
  items: Array<{
    type: QuestionType
    stem: string
    options: Option[]
    answer: string
    analysis?: string
    knowledgePoint?: string
    order: number
  }>,
): Promise<number> {
  const now = Date.now()
  const rows: Question[] = items.map((it) => ({
    id: nanoid(),
    bankId,
    type: it.type,
    stem: it.stem,
    options: it.options,
    answer: it.answer,
    analysis: it.analysis,
    knowledgePoint: it.knowledgePoint,
    order: it.order,
    createdAt: now,
    updatedAt: now,
  }))
  await db.questions.bulkAdd(rows)
  await recountQuestions(bankId)
  return rows.length
}

export async function updateQuestion(
  id: string,
  patch: Partial<Question>,
): Promise<void> {
  await db.questions.update(id, { ...patch, updatedAt: Date.now() })
  const q = await db.questions.get(id)
  if (q) await recountQuestions(q.bankId)
}

export async function deleteQuestion(id: string): Promise<void> {
  const q = await db.questions.get(id)
  if (!q) return
  await db.transaction('rw', db.questions, db.practiceRecords, db.wrongQuestions, async () => {
    await db.questions.delete(id)
    await db.practiceRecords.where('questionId').equals(id).delete()
    await db.wrongQuestions.delete(id)
  })
  await recountQuestions(q.bankId)
}

export async function countQuestions(bankId: string): Promise<number> {
  return db.questions.where('bankId').equals(bankId).count()
}

export async function getNextOrder(bankId: string): Promise<number> {
  const count = await countQuestions(bankId)
  return count
}
