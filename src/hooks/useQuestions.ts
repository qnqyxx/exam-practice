import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import * as questionsRepo from '@/lib/db/questions.repo'
import type { Option, QuestionType, Question } from '@/types'

export function useQuestions(bankId: string | undefined) {
  const questions = useLiveQuery(
    async (): Promise<Question[]> => {
      if (!bankId) return []
      return db.questions
        .where('[bankId+order]')
        .between([bankId, -Infinity], [bankId, Infinity])
        .toArray()
    },
    [bankId],
  )
  return {
    questions: questions ?? [],
    loading: questions === undefined,
    createQuestion: questionsRepo.createQuestion,
    bulkCreate: questionsRepo.bulkCreateQuestions,
    updateQuestion: questionsRepo.updateQuestion,
    deleteQuestion: questionsRepo.deleteQuestion,
    countQuestions: questionsRepo.countQuestions,
    getNextOrder: questionsRepo.getNextOrder,
  }
}

export type { Option, QuestionType }
