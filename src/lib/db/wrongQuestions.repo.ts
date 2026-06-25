import { db } from './database'
import type { WrongQuestion } from '@/types'

// 答错时调用：upsert 错题记录
export async function upsertWrong(
  questionId: string,
  bankId: string,
): Promise<void> {
  const existing = await db.wrongQuestions.get(questionId)
  const now = Date.now()
  if (existing) {
    await db.wrongQuestions.update(questionId, {
      wrongCount: existing.wrongCount + 1,
      lastWrongAt: now,
      mastered: false, // 重新答错则取消已掌握
    })
  } else {
    const wq: WrongQuestion = {
      id: questionId,
      questionId,
      bankId,
      wrongCount: 1,
      mastered: false,
      addedAt: now,
      lastWrongAt: now,
    }
    await db.wrongQuestions.put(wq)
  }
}

// 答对且来自错题本练习时调用：标记已掌握
export async function markMastered(questionId: string): Promise<void> {
  await db.wrongQuestions.update(questionId, {
    mastered: true,
    lastReviewedAt: Date.now(),
  })
}

export async function listWrongByBank(bankId: string): Promise<WrongQuestion[]> {
  // boolean 不能索引，按 bankId 取后内存过滤
  const all = await db.wrongQuestions.where('bankId').equals(bankId).toArray()
  return all.filter((w) => !w.mastered)
}

export async function listAllWrong(masteredOnly = false): Promise<WrongQuestion[]> {
  // IndexedDB 不能直接索引 boolean，这里取全部后内存过滤
  const all = await db.wrongQuestions.toArray()
  return all.filter((w) => (masteredOnly ? w.mastered : !w.mastered))
}

export async function removeWrong(questionId: string): Promise<void> {
  await db.wrongQuestions.delete(questionId)
}

export async function clearMastered(bankId?: string): Promise<void> {
  const all = await db.wrongQuestions.toArray()
  const toDelete = all.filter(
    (w) => w.mastered && (!bankId || w.bankId === bankId),
  )
  await db.wrongQuestions.bulkDelete(toDelete.map((w) => w.id))
}

export async function countWrong(bankId?: string): Promise<number> {
  const all = await db.wrongQuestions.toArray()
  return all.filter(
    (w) => !w.mastered && (!bankId || w.bankId === bankId),
  ).length
}
