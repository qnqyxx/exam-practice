import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { countRecordsByDay, getOverallStats } from '@/lib/db/practiceRecords.repo'

export interface DashboardStats {
  totalQuestions: number
  totalBanks: number
  practicedToday: number
  overallAccuracy: number
  streakDays: number
}

export function useDashboardStats(): {
  stats: DashboardStats | null
  loading: boolean
} {
  const data = useLiveQuery(async () => {
    const [totalQuestions, banks, overall, daily] = await Promise.all([
      db.questions.count(),
      db.banks.count(),
      getOverallStats(),
      countRecordsByDay(60),
    ])

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const practicedToday = daily
      .filter((d) => d.day === todayStr)
      .reduce((s, d) => s + d.total, 0)

    // 连续练习天数
    const daySet = new Set(daily.map((d) => d.day))
    let streak = 0
    const cursor = new Date()
    while (true) {
      const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      if (daySet.has(ds)) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else if (streak === 0) {
        // 今天没练，不算中断
        cursor.setDate(cursor.getDate() - 1)
        if (cursor.getTime() < Date.now() - 2 * 24 * 60 * 60 * 1000) break
      } else {
        break
      }
    }

    return {
      totalQuestions,
      totalBanks: banks,
      practicedToday,
      overallAccuracy: overall.total > 0 ? overall.correct / overall.total : 0,
      streakDays: streak,
    }
  }, [])

  return { stats: data ?? null, loading: data === undefined }
}

export function useAccuracyTrend(days = 30) {
  const data = useLiveQuery(() => countRecordsByDay(days), [days])
  return (
    (data ?? []).map((d) => ({
      day: d.day.slice(5), // MM-DD
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      total: d.total,
    })) ?? []
  )
}

export function useBankProgress() {
  const data = useLiveQuery(async () => {
    const banks = await db.banks.toArray()
    const result: Array<{ name: string; practiced: number; total: number }> = []
    for (const b of banks) {
      const total = b.questionCount
      const practiced = await db.practiceRecords
        .where('bankId')
        .equals(b.id)
        .uniqueKeys()
        .then((keys) => keys.length)
      result.push({ name: b.name, practiced, total })
    }
    return result
  }, [])
  return data ?? []
}

export function useTypeDistribution() {
  const data = useLiveQuery(async () => {
    const banks = await db.banks.toArray()
    const all: Array<{ type: string; name: string }> = []
    for (const b of banks) {
      const qs = await db.questions.where('bankId').equals(b.id).toArray()
      for (const q of qs) all.push({ type: q.type, name: b.name })
    }
    const counts: Record<string, number> = {}
    for (const q of all) counts[q.type] = (counts[q.type] ?? 0) + 1
    return counts
  }, [])
  return data ?? {}
}

export function useActivityCalendar() {
  const data = useLiveQuery(() => countRecordsByDay(365), [])
  return data ?? []
}
