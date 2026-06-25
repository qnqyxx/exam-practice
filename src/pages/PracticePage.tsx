import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/database'
import { PracticeView } from '@/components/practice/PracticeView'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import type { Question } from '@/types'

interface PracticePageProps {
  mode: 'sequential' | 'wrongbook'
}

export function PracticePage({ mode }: PracticePageProps) {
  const { bankId } = useParams<{ bankId: string }>()
  const navigate = useNavigate()

  const questions = useLiveQuery(async (): Promise<Question[]> => {
    if (!bankId) return []
    if (mode === 'sequential') {
      return db.questions
        .where('[bankId+order]')
        .between([bankId, -Infinity], [bankId, Infinity])
        .toArray()
    }
    // wrongbook 模式：取该库未掌握的错题
    const wrongs = await db.wrongQuestions.where('bankId').equals(bankId).toArray()
    const unmastered = wrongs.filter((w) => !w.mastered)
    if (unmastered.length === 0) return []
    const qs = await db.questions.bulkGet(unmastered.map((w) => w.questionId))
    return qs.filter(Boolean) as Question[]
  }, [bankId, mode])

  if (questions === undefined) {
    return <div className="py-20 text-center text-muted-foreground">加载中…</div>
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <EmptyState
          title={mode === 'wrongbook' ? '没有错题需要练习' : '该题库暂无题目'}
          description={
            mode === 'wrongbook'
              ? '全部错题已掌握，继续保持！'
              : '请先上传文档或手动添加题目'
          }
          action={
            <Button
              onClick={() =>
                navigate(mode === 'wrongbook' ? '/wrongbook' : `/banks/${bankId}`)
              }
            >
              返回
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <PracticeView
      questions={questions}
      bankId={bankId!}
      mode={mode}
      onExit={() => navigate(mode === 'wrongbook' ? '/wrongbook' : `/banks/${bankId}`)}
    />
  )
}
