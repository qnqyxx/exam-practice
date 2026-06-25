import { db } from '@/lib/db/database'
import type { QuestionBank, Question } from '@/types'

interface ExportData {
  version: 1
  exportedAt: number
  bank: Omit<QuestionBank, 'questionCount'> & { questionCount: number }
  questions: Question[]
}

export async function exportBank(bankId: string): Promise<void> {
  const bank = await db.banks.get(bankId)
  if (!bank) throw new Error('题库不存在')
  const questions = await db.questions
    .where('[bankId+order]')
    .between([bankId, -Infinity], [bankId, Infinity])
    .toArray()

  const data: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    bank,
    questions,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = bank.name.replace(/[\\/:*?"<>|]/g, '_')
  a.download = `${safeName}-题库导出.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBank(file: File): Promise<string> {
  const text = await file.text()
  const data = JSON.parse(text) as ExportData
  if (data.version !== 1) throw new Error('不支持的导出文件版本')

  // 重新生成 ID 避免冲突
  const now = Date.now()
  const { nanoid } = await import('nanoid')
  const newBank = { ...data.bank, id: nanoid(), createdAt: now, updatedAt: now }
  const newQuestions = data.questions.map((q) => ({
    ...q,
    id: nanoid(),
    bankId: newBank.id,
    createdAt: now,
    updatedAt: now,
  }))

  await db.transaction('rw', db.banks, db.questions, async () => {
    await db.banks.add(newBank)
    await db.questions.bulkAdd(newQuestions)
  })

  return newBank.id
}
