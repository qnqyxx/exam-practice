import { useState } from 'react'
import { Trash2, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OptionEditor } from '@/components/question/OptionEditor'
import { QuestionType, QUESTION_TYPE_LABELS, QUESTION_TYPE_ORDER } from '@/types/enums'
import type { Option } from '@/types'
import type { ParsedQuestion } from '@/lib/parse/types'

interface ParsedReviewTableProps {
  questions: ParsedQuestion[]
  onChange: (questions: ParsedQuestion[]) => void
}

function ConfidenceIcon({ confidence, needsReview }: { confidence: number; needsReview: boolean }) {
  if (!needsReview && confidence >= 0.8) {
    return <CheckCircle2 className="size-4 text-success" />
  }
  if (confidence < 0.5) {
    return <AlertCircle className="size-4 text-destructive" />
  }
  return <AlertTriangle className="size-4 text-warning" />
}

export function ParsedReviewTable({ questions, onChange }: ParsedReviewTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [onlyReview, setOnlyReview] = useState(false)

  const visible = onlyReview ? questions.filter((q) => q.needsReview) : questions

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const update = (id: string, patch: Partial<ParsedQuestion>) => {
    onChange(questions.map((q) => (q.tempId === id ? { ...q, ...patch } : q)))
  }

  const remove = (id: string) => {
    onChange(questions.filter((q) => q.tempId !== id))
  }

  const expandAll = () => setExpanded(new Set(questions.map((q) => q.tempId)))
  const collapseAll = () => setExpanded(new Set())

  const reviewCount = questions.filter((q) => q.needsReview).length

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">共 {questions.length} 题</span>
          {reviewCount > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning-foreground">
              {reviewCount} 题待核对
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={onlyReview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOnlyReview(!onlyReview)}
          >
            {onlyReview ? '显示全部' : '仅看待核对'}
          </Button>
          <Button variant="outline" size="sm" onClick={expandAll}>
            全部展开
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            全部收起
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((q) => {
          const isOpen = expanded.has(q.tempId)
          const hasOptions =
            q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice
          return (
            <div
              key={q.tempId}
              className={cn(
                'rounded-lg border',
                q.needsReview && q.confidence < 0.5
                  ? 'border-destructive/30 bg-destructive/5'
                  : q.needsReview
                    ? 'border-warning/30 bg-warning/5'
                    : 'border-border',
              )}
            >
              <div
                className="flex cursor-pointer items-start gap-3 p-3"
                onClick={() => toggle(q.tempId)}
              >
                <span className="mt-0.5">
                  {isOpen ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </span>
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                  {q.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ConfidenceIcon confidence={q.confidence} needsReview={q.needsReview} />
                    {q.type && (
                      <Badge variant="outline" className="text-xs">
                        {QUESTION_TYPE_LABELS[q.type]}
                      </Badge>
                    )}
                    {q.warnings.length > 0 && (
                      <span className="text-xs text-warning">{q.warnings.join('；')}</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm">{q.stem || '(空题干)'}</p>
                  {q.answer && (
                    <p className="mt-1 text-xs text-success">答案：{q.answer}</p>
                  )}
                  {(q.analysis || q.knowledgePoint) && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {q.analysis && (
                        <span className="line-clamp-1">
                          解析：{q.analysis}
                        </span>
                      )}
                      {q.knowledgePoint && (
                        <span className="line-clamp-1 text-info-foreground">
                          知识点：{q.knowledgePoint}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(q.tempId)
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {isOpen && (
                <div className="space-y-3 border-t bg-background p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">题型</label>
                      <Select
                        value={q.type ?? QuestionType.SingleChoice}
                        onValueChange={(v) => update(q.tempId, { type: v as QuestionType })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPE_ORDER.map((t) => (
                            <SelectItem key={t} value={t}>
                              {QUESTION_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">答案</label>
                      <Input
                        value={q.answer}
                        onChange={(e) => update(q.tempId, { answer: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">题干</label>
                    <Textarea
                      value={q.stem}
                      onChange={(e) => update(q.tempId, { stem: e.target.value })}
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  {hasOptions && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">选项</label>
                      <OptionEditor
                        options={q.options}
                        onChange={(options: Option[]) => update(q.tempId, { options })}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">解析</label>
                    <Textarea
                      value={q.analysis}
                      onChange={(e) => update(q.tempId, { analysis: e.target.value })}
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">知识点</label>
                    <Input
                      value={q.knowledgePoint}
                      onChange={(e) => update(q.tempId, { knowledgePoint: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="如：第三章 网络层协议"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
