import { nanoid } from 'nanoid'
import { db } from './database'
import type { QuestionBank } from '@/types'

export async function listBanks(): Promise<QuestionBank[]> {
  return db.banks.orderBy('updatedAt').reverse().toArray()
}

export async function getBank(id: string): Promise<QuestionBank | undefined> {
  return db.banks.get(id)
}

export async function createBank(
  data: Pick<QuestionBank, 'name'> & Partial<QuestionBank>,
): Promise<QuestionBank> {
  const now = Date.now()
  const bank: QuestionBank = {
    id: nanoid(),
    name: data.name,
    description: data.description,
    tags: data.tags,
    questionCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.banks.add(bank)
  return bank
}

export async function updateBank(
  id: string,
  patch: Partial<QuestionBank>,
): Promise<void> {
  await db.banks.update(id, { ...patch, updatedAt: Date.now() })
}

export async function deleteBank(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.banks,
    db.questions,
    db.practiceRecords,
    db.wrongQuestions,
    async () => {
      await db.questions.where('bankId').equals(id).delete()
      await db.practiceRecords.where('bankId').equals(id).delete()
      await db.wrongQuestions.where('bankId').equals(id).delete()
      await db.banks.delete(id)
    },
  )
}

export async function recountQuestions(bankId: string): Promise<void> {
  const count = await db.questions.where('bankId').equals(bankId).count()
  await db.banks.update(bankId, { questionCount: count, updatedAt: Date.now() })
}
