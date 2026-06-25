import { create } from 'zustand'
import type { ParseResult } from '@/lib/parse/types'

type Step = 'select' | 'parsing' | 'review' | 'done'

interface UploadState {
  step: Step
  bankId: string | null
  result: ParseResult | null
  progress: number
  error: string | null
  setStep: (s: Step) => void
  setBankId: (id: string | null) => void
  setResult: (r: ParseResult | null) => void
  setProgress: (p: number) => void
  setError: (e: string | null) => void
  reset: () => void
}

export const useUploadStore = create<UploadState>((set) => ({
  step: 'select',
  bankId: null,
  result: null,
  progress: 0,
  error: null,
  setStep: (s) => set({ step: s }),
  setBankId: (id) => set({ bankId: id }),
  setResult: (r) => set({ result: r }),
  setProgress: (p) => set({ progress: p }),
  setError: (e) => set({ error: e }),
  reset: () =>
    set({ step: 'select', bankId: null, result: null, progress: 0, error: null }),
}))
