import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Upload, Play, Pencil, Trash2, FileQuestion } from 'lucide-react'
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
import { QuestionType } from '@/types/enums'
import type { Question, Option } from '@/types'

export function BankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>()
  const { bank } = useBank(bankId)
  const { questions, loading, createQuestion, updateQuestion, deleteQuestion, getNextOrder } =
    useQuestions(bankId)

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
        <Button size="lg" className="mb-6 w-full" asChild>
          <Link to={`/practice/${bankId}`}>
            <Play className="mr-2 size-4" />
            开始练习（{questions.length} 题）
          </Link>
        </Button>
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
                    <div className="mt-2 text-xs text-emerald-600">
                      答案：{q.answer}
                    </div>
                    {q.analysis && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        解析：{q.analysis}
                      </div>
                    )}
                    {q.knowledgePoint && (
                      <div className="mt-1 inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
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
