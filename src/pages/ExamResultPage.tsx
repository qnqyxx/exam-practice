import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, CircleDashed, RotateCcw } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { QuestionTypeBadge } from '@/components/question/QuestionTypeBadge'
import type { Question } from '@/types'

interface ExamResultPayload {
  bankId: string
  questions: Question[]
  userAnswers: Record<string, string>
  results: { questionId: string; userAnswer: string; correct: boolean | null }[]
  durationSec: number
  usedSec: number
}

export function ExamResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { bankId } = useParams<{ bankId: string }>()
  const payload = location.state as ExamResultPayload | null

  if (!payload) {
    return (
      <PageContainer>
        <EmptyState
          title="无成绩数据"
          description="请从模考入口进入"
          action={<Button onClick={() => navigate(`/banks/${bankId}`)}>返回题库</Button>}
        />
      </PageContainer>
    )
  }

  const { questions, results, durationSec, usedSec } = payload
  const resultMap = new Map(results.map((r) => [r.questionId, r]))

  const correctCount = results.filter((r) => r.correct === true).length
  const wrongCount = results.filter((r) => r.correct === false).length
  const pendingCount = results.filter((r) => r.correct === null).length
  const answeredCount = results.filter((r) => r.userAnswer && r.userAnswer.length > 0).length
  const totalCount = results.length
  // 正确率：仅统计客观题（排除填空待自评）
  const objectiveTotal = totalCount - pendingCount
  const accuracy = objectiveTotal > 0 ? Math.round((correctCount / objectiveTotal) * 100) : 0
  const usedMin = Math.floor(usedSec / 60)
  const usedSecRemain = usedSec % 60

  return (
    <PageContainer>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to={`/banks/${bankId}`}>
          <ArrowLeft className="mr-1 size-4" />
          返回题库
        </Link>
      </Button>

      {/* 成绩卡 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground">模考成绩</p>
            <p className="mt-1 text-4xl font-bold">
              {correctCount}
              <span className="text-lg text-muted-foreground"> / {objectiveTotal}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">正确率 {accuracy}%</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-center">
              <CheckCircle2 className="mx-auto mb-1 size-5 text-success" />
              <p className="text-xl font-bold text-success-foreground">{correctCount}</p>
              <p className="text-xs text-muted-foreground">答对</p>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center">
              <XCircle className="mx-auto mb-1 size-5 text-destructive" />
              <p className="text-xl font-bold text-destructive">{wrongCount}</p>
              <p className="text-xs text-muted-foreground">答错</p>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-center">
              <CircleDashed className="mx-auto mb-1 size-5 text-warning" />
              <p className="text-xl font-bold text-warning-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">待自评</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xl font-bold">{usedMin}:{String(usedSecRemain).padStart(2, '0')}</p>
              <p className="text-xs text-muted-foreground">用时（共 {Math.floor(durationSec / 60)} 分钟）</p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            共 {totalCount} 题，已作答 {answeredCount} 题
          </p>
        </CardContent>
      </Card>

      {/* 逐题回顾 */}
      <h3 className="mb-3 text-lg font-semibold">逐题回顾</h3>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const r = resultMap.get(q.id)
          const isCorrect = r?.correct === true
          const isWrong = r?.correct === false
          const isPending = r?.correct === null
          const ua = r?.userAnswer ?? ''
          return (
            <Card key={q.id} className={isCorrect ? 'border-success/40' : isWrong ? 'border-destructive/40' : ''}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">第 {i + 1} 题</span>
                  <QuestionTypeBadge type={q.type} />
                  {isCorrect && <CheckCircle2 className="ml-auto size-4 text-success" />}
                  {isWrong && <XCircle className="ml-auto size-4 text-destructive" />}
                  {isPending && <CircleDashed className="ml-auto size-4 text-warning" />}
                </div>
                <p className="mb-3 text-sm leading-relaxed">{q.stem}</p>
                {q.options.length > 0 && (
                  <div className="mb-3 space-y-1 text-sm text-muted-foreground">
                    {q.options.map((o) => (
                      <div key={o.key} className="flex gap-2">
                        <span className="font-medium">{o.key}.</span>
                        <span>{o.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span>
                    <span className="text-muted-foreground">你的答案：</span>
                    <span className={isWrong ? 'font-medium text-destructive' : 'font-medium'}>
                      {ua ? ua : '未作答'}
                    </span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">正确答案：</span>
                    <span className="font-medium text-success-foreground">{q.answer}</span>
                  </span>
                </div>
                {isPending && (
                  <p className="mt-2 text-xs text-warning-foreground">填空题需自评，未计入对错统计</p>
                )}
                {q.analysis && (
                  <div className="mt-2 rounded border border-l-4 border-warning/30 border-l-warning bg-warning/15 p-2 text-xs">
                    <span className="font-medium">解析：</span>{q.analysis}
                  </div>
                )}
                {q.knowledgePoint && (
                  <div className="mt-1 rounded border border-l-4 border-info/30 border-l-info bg-info/15 p-2 text-xs">
                    <span className="font-medium">知识点：</span>{q.knowledgePoint}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 底部操作 */}
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" asChild>
          <Link to={`/banks/${bankId}`}>返回题库</Link>
        </Button>
        <Button asChild>
          <Link to={`/practice/${bankId}/exam?count=${totalCount}&duration=${Math.ceil(durationSec / 60)}`}>
            <RotateCcw className="mr-1 size-4" />
            再练一套
          </Link>
        </Button>
      </div>
    </PageContainer>
  )
}
