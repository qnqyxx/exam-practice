import { useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { PracticeView } from '@/components/practice/PracticeView'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { shuffle } from '@/lib/utils/shuffle'
import { QuestionType } from '@/types/enums'
import type { Question } from '@/types'

interface PracticePageProps {
  mode: 'sequential' | 'wrongbook' | 'random' | 'exam'
}

export function PracticePage({ mode }: PracticePageProps) {
  const { bankId, qtype } = useParams<{ bankId: string; qtype: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const shuffleOptions = searchParams.get('shuffleOptions') === '1'
  const examCount = searchParams.get('count')
  const examDuration = searchParams.get('duration')

  const questions = useLiveQuery(async (): Promise<Question[]> => {
    if (!bankId) return []
    if (mode === 'sequential') {
      return db.questions
        .where('[bankId+order]')
        .between([bankId, -Infinity], [bankId, Infinity])
        .toArray()
    }
    if (mode === 'wrongbook') {
      const wrongs = await db.wrongQuestions.where('bankId').equals(bankId).toArray()
      const unmastered = wrongs.filter((w) => !w.mastered)
      if (unmastered.length === 0) return []
      const qs = await db.questions.bulkGet(unmastered.map((w) => w.questionId))
      return qs.filter(Boolean) as Question[]
    }
    // random / exam：取该库全部题目
    const all = await db.questions
      .where('[bankId+order]')
      .between([bankId, -Infinity], [bankId, Infinity])
      .toArray()
    // 题型专项（qtype 路径参数）
    let filtered = all
    if (qtype) {
      filtered = all.filter((q) => q.type === (qtype as QuestionType))
    }
    if (mode === 'random') {
      return shuffle(filtered)
    }
    // exam：按 count 随机抽题，不足取全部
    const n = examCount ? Math.max(1, parseInt(examCount, 10)) : filtered.length
    return shuffle(filtered).slice(0, n)
  }, [bankId, mode, qtype, examCount])

  // 选项乱序映射（仅 random + shuffleOptions=1 时生成，稳定挂在 questions 上）
  // 用 useMemo 保证只在 questions/mode/shuffleOptions 变化时重算，避免每 render 重新 shuffle
  const displayOrderMap = useMemo(() => {
    if (mode !== 'random' || !shuffleOptions || !questions) return undefined
    const map: Record<string, string[]> = {}
    for (const q of questions) {
      if (q.options.length > 0) {
        map[q.id] = shuffle(q.options.map((o) => o.key))
      }
    }
    return map
  }, [questions, mode, shuffleOptions])

  // exam 配置（用 useMemo 保证 deadline 在会话周期内稳定）
  const examConfig = useMemo(() => {
    if (mode !== 'exam') return undefined
    const durationSec = examDuration ? Math.max(1, parseInt(examDuration, 10)) * 60 : 0
    if (durationSec <= 0) return undefined
    return { durationSec, deadline: Date.now() + durationSec * 1000 }
  }, [mode, examDuration])

  if (questions === undefined) {
    return <div className="py-20 text-center text-muted-foreground">加载中…</div>
  }

  if (questions.length === 0) {
    const backPath = mode === 'wrongbook' ? '/wrongbook' : `/banks/${bankId}`
    const title = mode === 'wrongbook'
      ? '没有错题需要练习'
      : qtype ? '该题型暂无题目' : '该题库暂无题目'
    const desc = mode === 'wrongbook'
      ? '全部错题已掌握，继续保持！'
      : qtype ? '请选择其他题型或先添加该类型题目' : '请先上传文档或手动添加题目'
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <EmptyState
          title={title}
          description={desc}
          action={<Button onClick={() => navigate(backPath)}>返回</Button>}
        />
      </div>
    )
  }

  return (
    <PracticeView
      questions={questions}
      bankId={bankId!}
      mode={mode}
      onExit={() => navigate(`/banks/${bankId}`)}
      displayOrderMap={displayOrderMap}
      examConfig={examConfig}
    />
  )
}
