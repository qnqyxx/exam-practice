import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Upload, Play, Pencil, Trash2, FileQuestion, Shuffle, Filter, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { QuestionEditor } from '@/components/question/QuestionEditor'
import { QuestionTypeBadge } from '@/components/question/QuestionTypeBadge'
import { useBank } from '@/hooks/useBanks'
import { useQuestions } from '@/hooks/useQuestions'
import { usePracticeStore } from '@/store/practiceStore'
import { QuestionType, QUESTION_TYPE_LABELS, QUESTION_TYPE_ORDER } from '@/types/enums'
import type { Question, Option } from '@/types'

export function BankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>()
  const { bank } = useBank(bankId)
  const { questions, loading, createQuestion, updateQuestion, deleteQuestion, getNextOrder } =
    useQuestions(bankId)
  const session = usePracticeStore((s) => s.session)
  const endSession = usePracticeStore((s) => s.endSession)

  const resumableSession =
    session &&
    session.bankId === bankId &&
    session.mode === 'sequential' &&
    session.currentIndex < session.questions.length - 1
    ? session
    : null

  const [editorOpen, setEditorOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Question | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)

  const handleSave = async (data: {
    type: QuestionType
    stem: string
    options: Option[]
    answer: string
    analysis?: string
    knowledgePoint?: string
  }) => {
    if (editTarget) {
      await updateQuestion(editTarget.id, data)
      toast.success('题目已更新')
    } else {
      const order = await getNextOrder(bankId!)
      await createQuestion({ ...data, bankId: bankId!, order })
      toast.success('题目已添加')
    }
    setEditTarget(undefined)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteQuestion(deleteTarget.id)
    toast.success('已删除')
    setDeleteTarget(null)
  }

  const [shuffleOpts, setShuffleOpts] = useState(false)
  const [examCount, setExamCount] = useState(Math.min(10, questions.length))
  const [examMinutes, setExamMinutes] = useState(10)

  const typeCounts = QUESTION_TYPE_ORDER.map((t) => ({
    type: t,
    label: QUESTION_TYPE_LABELS[t],
    count: questions.filter((q) => q.type === t).length,
  }))

  if (!bank && !loading) {
    return (
      <PageContainer>
        <EmptyState title="题库不存在" description="它可能已被删除" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/banks">
          <ArrowLeft className="mr-1 size-4" />
          返回题库列表
        </Link>
      </Button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{bank?.name}</h2>
          {bank?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{bank.description}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">共 {questions.length} 题</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/upload?bankId=${bankId}`}>
              <Upload className="mr-1 size-4" />
              导入文档
            </Link>
          </Button>
          <Button
            onClick={() => {
              setEditTarget(undefined)
              setEditorOpen(true)
            }}
          >
            <Plus className="mr-1 size-4" />
            手动加题
          </Button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="mb-6 space-y-3">
          {resumableSession && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-l-4 border-info/30 border-l-info bg-info/15 p-3">
              <div className="text-sm">
                <span className="font-medium">上次练习进行到第 {resumableSession.currentIndex + 1}/{resumableSession.questions.length} 题</span>
                <span className="ml-2 text-muted-foreground">是否继续？</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link to={`/practice/${bankId}`}>继续</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => endSession()}>
                  重新开始
                </Button>
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* 顺序练习 */}
            <Button size="lg" variant="outline" className="h-auto justify-start py-4" asChild>
              <Link to={`/practice/${bankId}`}>
                <Play className="mr-3 size-5 shrink-0" />
                <span className="text-left">
                  <span className="block font-medium">顺序练习</span>
                  <span className="block text-xs text-muted-foreground">按题号顺序，{questions.length} 题</span>
                </span>
              </Link>
            </Button>

            {/* 随机练习 */}
            <Button size="lg" variant="outline" className="h-auto justify-start py-4" asChild>
              <Link to={`/practice/${bankId}/random?shuffleOptions=${shuffleOpts ? '1' : '0'}`}>
                <Shuffle className="mr-3 size-5 shrink-0" />
                <span className="text-left">
                  <span className="block font-medium">随机练习</span>
                  <span className="block text-xs text-muted-foreground">打乱题序{shuffleOpts ? ' + 选项' : ''}</span>
                </span>
              </Link>
            </Button>
          </div>

          {/* 随机练习选项 */}
          <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={shuffleOpts}
              onChange={(e) => setShuffleOpts(e.target.checked)}
              className="size-4 rounded border-border"
            />
            同时打乱选项顺序（防"背位置"）
          </label>

          {/* 题型专项 */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Filter className="size-4" />
              题型专项练习
            </div>
            <div className="flex flex-wrap gap-2">
              {typeCounts.map(({ type, label, count }) => (
                <Button
                  key={type}
                  size="sm"
                  variant={count === 0 ? 'ghost' : 'outline'}
                  disabled={count === 0}
                  asChild={count > 0}
                >
                  {count > 0 ? (
                    <Link to={`/practice/${bankId}/type/${type}`}>
                      {label}（{count}）
                    </Link>
                  ) : (
                    <span>{label}（0）</span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* 限时模考 */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Timer className="size-4" />
              限时模拟考试
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                题量
                <input
                  type="number"
                  min={1}
                  max={questions.length}
                  value={examCount}
                  onChange={(e) => setExamCount(Math.max(1, Math.min(questions.length, Number(e.target.value) || 1)))}
                  className="ml-2 w-20 rounded border bg-background px-2 py-1 text-sm"
                />
              </label>
              <label className="text-sm">
                时长(分钟)
                <input
                  type="number"
                  min={1}
                  value={examMinutes}
                  onChange={(e) => setExamMinutes(Math.max(1, Number(e.target.value) || 1))}
                  className="ml-2 w-20 rounded border bg-background px-2 py-1 text-sm"
                />
              </label>
              <Button asChild>
                <Link to={`/practice/${bankId}/exam?count=${Math.min(examCount, questions.length)}&duration=${examMinutes}`}>
                  <Timer className="mr-1 size-4" />
                  开始模考
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<FileQuestion className="size-12" />}
          title="还没有题目"
          description="手动添加题目，或上传 Word/PDF 文档自动提取"
          action={
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setEditTarget(undefined)
                  setEditorOpen(true)
                }}
              >
                <Plus className="mr-1 size-4" />
                手动加题
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/upload?bankId=${bankId}`}>
                  <Upload className="mr-1 size-4" />
                  导入文档
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <Card key={q.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <QuestionTypeBadge type={q.type} />
                    </div>
                    <p className="text-sm leading-relaxed">{q.stem}</p>
                    {q.options.length > 0 && (
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {q.options.map((o) => (
                          <div key={o.key} className="flex gap-2">
                            <span className="font-medium">{o.key}.</span>
                            <span>{o.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-success">
                      答案：{q.answer}
                    </div>
                    {q.analysis && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        解析：{q.analysis}
                      </div>
                    )}
                    {q.knowledgePoint && (
                      <div className="mt-1 inline-flex items-center rounded bg-info/10 px-1.5 py-0.5 text-xs text-info-foreground">
                        知识点：{q.knowledgePoint}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setEditTarget(q)
                        setEditorOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(q)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuestionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        question={editTarget}
        bankId={bankId!}
        order={0}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除题目"
        description="确定要删除这道题吗？相关练习记录和错题也会被清除。"
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
      />
    </PageContainer>
  )
}
