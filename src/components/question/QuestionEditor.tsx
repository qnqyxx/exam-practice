import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OptionEditor } from './OptionEditor'
import { QuestionType, QUESTION_TYPE_LABELS, QUESTION_TYPE_ORDER } from '@/types/enums'
import type { Question, Option } from '@/types'

interface QuestionEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question?: Question
  bankId: string
  order: number
  onSave: (data: {
    type: QuestionType
    stem: string
    options: Option[]
    answer: string
    analysis?: string
    knowledgePoint?: string
  }) => void
}

export function QuestionEditor({
  open,
  onOpenChange,
  question,
  bankId: _bankId,
  order: _order,
  onSave,
}: QuestionEditorProps) {
  const [type, setType] = useState<QuestionType>(QuestionType.SingleChoice)
  const [stem, setStem] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [answer, setAnswer] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [knowledgePoint, setKnowledgePoint] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (question) {
      setType(question.type)
      setStem(question.stem)
      setOptions(question.options)
      setAnswer(question.answer)
      setAnalysis(question.analysis ?? '')
      setKnowledgePoint(question.knowledgePoint ?? '')
    } else {
      setType(QuestionType.SingleChoice)
      setStem('')
      setOptions([
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ])
      setAnswer('')
      setAnalysis('')
      setKnowledgePoint('')
    }
    setError('')
  }, [question, open])

  const hasOptions =
    type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice

  const handleSave = () => {
    if (!stem.trim()) {
      setError('请输入题干')
      return
    }
    if (hasOptions && options.filter((o) => o.text.trim()).length < 2) {
      setError('选择题至少需要 2 个选项')
      return
    }
    if (!answer.trim()) {
      setError('请输入答案')
      return
    }
    onSave({
      type,
      stem: stem.trim(),
      options: hasOptions ? options.filter((o) => o.text.trim()) : [],
      answer: answer.trim(),
      analysis: analysis.trim() || undefined,
      knowledgePoint: knowledgePoint.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? '编辑题目' : '新增题目'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>题型</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
              <SelectTrigger>
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

          <div className="space-y-1.5">
            <Label>题干</Label>
            <Textarea
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder="输入题目内容…"
              rows={3}
            />
          </div>

          {hasOptions && (
            <div className="space-y-1.5">
              <Label>选项</Label>
              <OptionEditor options={options} onChange={setOptions} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              答案
              {hasOptions && '（选项字母，多选用多个字母如 ACD）'}
              {type === QuestionType.TrueFalse && '（T 对 / F 错）'}
            </Label>
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={hasOptions ? '如 A 或 ACD' : '输入正确答案'}
            />
          </div>

          <div className="space-y-1.5">
            <Label>解析（可选）</Label>
            <Textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="答案解析…"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>知识点（可选）</Label>
            <Input
              value={knowledgePoint}
              onChange={(e) => setKnowledgePoint(e.target.value)}
              placeholder="如：第三章 网络层协议"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
