import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import * as banksRepo from '@/lib/db/banks.repo'
import type { QuestionBank } from '@/types'

export function useBanks() {
  const banks = useLiveQuery(() => banksRepo.listBanks(), [])
  return {
    banks: banks ?? [],
    loading: banks === undefined,
    createBank: banksRepo.createBank,
    updateBank: banksRepo.updateBank,
    deleteBank: banksRepo.deleteBank,
  }
}

export function useBank(id: string | undefined) {
  const bank = useLiveQuery(() => (id ? db.banks.get(id) : undefined), [id])
  return { bank, loading: id !== undefined && bank === undefined }
}

export type { QuestionBank }
