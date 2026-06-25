import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import * as wrongRepo from '@/lib/db/wrongQuestions.repo'
import type { WrongQuestion, Question } from '@/types'

// 按题库分组的错题统计
export function useWrongBook() {
  const wrongList = useLiveQuery(
    () => db.wrongQuestions.toArray(),
    [],
  )
  const banks = useLiveQuery(() => db.banks.toArray(), [])

  const filtered = (wrongList ?? []).filter((w) => !w.mastered)

  // 按题库分组
  const byBank = new Map<string, WrongQuestion[]>()
  for (const w of filtered) {
    const arr = byBank.get(w.bankId) ?? []
    arr.push(w)
    byBank.set(w.bankId, arr)
  }

  const bankMap = new Map((banks ?? []).map((b) => [b.id, b]))

  return {
    wrongList: filtered,
    byBank,
    bankMap,
    total: filtered.length,
    markMastered: wrongRepo.markMastered,
    removeWrong: wrongRepo.removeWrong,
    clearMastered: wrongRepo.clearMastered,
    upsertWrong: wrongRepo.upsertWrong,
  }
}

export function useWrongQuestionsByBank(bankId: string | undefined) {
  const questions = useLiveQuery(
    async (): Promise<Question[]> => {
      if (!bankId) return []
      const wrongs = await db.wrongQuestions
        .where('bankId')
        .equals(bankId)
        .toArray()
      const unmastered = wrongs.filter((w) => !w.mastered)
      if (unmastered.length === 0) return []
      const ids = unmastered.map((w) => w.questionId)
      const result = await db.questions.bulkGet(ids)
      return result.filter((q): q is Question => !!q)
    },
    [bankId],
  )
  return questions ?? []
}
