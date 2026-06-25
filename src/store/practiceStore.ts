import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Question } from '@/types'

interface PracticeSession {
  bankId: string
  mode: 'sequential' | 'wrongbook'
  questions: Question[]
  currentIndex: number
  revealed: boolean
  userAnswer: string
  isCorrect: boolean | null
  startTime: number
}

interface PracticeState {
  session: PracticeSession | null
  startSession: (bankId: string, mode: 'sequential' | 'wrongbook', questions: Question[]) => void
  endSession: () => void
  setIndex: (i: number) => void
  next: () => void
  prev: () => void
  reveal: () => void
  setUserAnswer: (ans: string) => void
  setResult: (correct: boolean | null) => void
  resetCurrent: () => void
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      session: null,
      startSession: (bankId, mode, questions) =>
        set({
          session: {
            bankId,
            mode,
            questions,
            currentIndex: 0,
            revealed: false,
            userAnswer: '',
            isCorrect: null,
            startTime: Date.now(),
          },
        }),
      endSession: () => set({ session: null }),
      setIndex: (i) =>
        set((s) => {
          if (!s.session) return {}
          const clamped = Math.max(0, Math.min(i, s.session.questions.length - 1))
          return {
            session: {
              ...s.session,
              currentIndex: clamped,
              revealed: false,
              userAnswer: '',
              isCorrect: null,
              startTime: Date.now(),
            },
          }
        }),
      next: () =>
        set((s) => {
          if (!s.session) return {}
          return {
            session: {
              ...s.session,
              currentIndex: Math.min(s.session.currentIndex + 1, s.session.questions.length - 1),
              revealed: false,
              userAnswer: '',
              isCorrect: null,
              startTime: Date.now(),
            },
          }
        }),
      prev: () =>
        set((s) => {
          if (!s.session) return {}
          return {
            session: {
              ...s.session,
              currentIndex: Math.max(s.session.currentIndex - 1, 0),
              revealed: false,
              userAnswer: '',
              isCorrect: null,
              startTime: Date.now(),
            },
          }
        }),
      reveal: () =>
        set((s) =>
          s.session ? { session: { ...s.session, revealed: true } } : {},
        ),
      setUserAnswer: (ans) =>
        set((s) =>
          s.session ? { session: { ...s.session, userAnswer: ans } } : {},
        ),
      setResult: (correct) =>
        set((s) =>
          s.session ? { session: { ...s.session, isCorrect: correct } } : {},
        ),
      resetCurrent: () =>
        set((s) =>
          s.session
            ? {
                session: {
                  ...s.session,
                  revealed: false,
                  userAnswer: '',
                  isCorrect: null,
                  startTime: Date.now(),
                },
              }
            : {},
        ),
    }),
    { name: 'practice-session' },
  ),
)
