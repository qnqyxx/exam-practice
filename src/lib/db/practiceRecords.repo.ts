import { nanoid } from 'nanoid'
import { db } from './database'
import type { PracticeRecord } from '@/types'

export async function addRecord(
  data: Omit<PracticeRecord, 'id'>,
): Promise<PracticeRecord> {
  const rec: PracticeRecord = { ...data, id: nanoid() }
  await db.practiceRecords.add(rec)
  return rec
}

export async function listRecordsByBank(bankId: string): Promise<PracticeRecord[]> {
  return db.practiceRecords.where('bankId').equals(bankId).toArray()
}

export async function countRecordsByDay(days: number): Promise<
  Array<{ day: string; total: number; correct: number }>
> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const records = await db.practiceRecords.where('practicedAt').above(since).toArray()
  const map = new Map<string, { total: number; correct: number }>()
  for (const r of records) {
    const d = new Date(r.practicedAt)
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const cur = map.get(day) ?? { total: 0, correct: 0 }
    cur.total++
    if (r.isCorrect) cur.correct++
    map.set(day, cur)
  }
  return [...map.entries()]
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.day.localeCompare(b.day))
}

export async function getOverallStats(): Promise<{
  total: number
  correct: number
}> {
  // IndexedDB 不能索引 boolean，取全部记录内存统计
  const all = await db.practiceRecords.toArray()
  return {
    total: all.length,
    correct: all.filter((r) => r.isCorrect).length,
  }
}
