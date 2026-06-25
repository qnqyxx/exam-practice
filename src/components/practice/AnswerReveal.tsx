import { CheckCircle2, XCircle, Lightbulb, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { QuestionType } from '@/types/enums'
import type { Question } from '@/types'

interface AnswerRevealProps {
  question: Question
  userAnswer: string
  isCorrect: boolean | null
  onSelfGrade: (correct: boolean) => void
}

export function AnswerReveal({ question, userAnswer, isCorrect, onSelfGrade }: AnswerRevealProps) {
  const isObjective =
    question.type === QuestionType.SingleChoice ||
    question.type === QuestionType.MultipleChoice ||
    question.type === QuestionType.TrueFalse

  return (
    <div className="space-y-4">
      {/* 答案对比 */}
      <div
        className={cn(
          'rounded-lg border p-4',
          isCorrect === true && 'border-emerald-200 bg-emerald-50',
          isCorrect === false && 'border-red-200 bg-red-50',
          isCorrect === null && 'border-border bg-muted/30',
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {isCorrect === true && <CheckCircle2 className="size-4 text-emerald-600" />}
          {isCorrect === false && <XCircle className="size-4 text-red-600" />}
          正确答案
        </div>
        <p className="mt-1.5 text-lg font-semibold">{question.answer}</p>
        {isObjective && userAnswer && (
          <p className="mt-1 text-sm text-muted-foreground">
            你的选择：
            <span className={isCorrect ? 'text-emerald-700' : 'text-red-700'}>
              {userAnswer}
            </span>
          </p>
        )}
      </div>

      {/* 知识点 */}
      {question.knowledgePoint && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
            <Bookmark className="size-4" />
            知识点
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-blue-900">
            {question.knowledgePoint}
          </p>
        </div>
      )}

      {/* 解析 */}
      {question.analysis && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Lightbulb className="size-4" />
            解析
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-amber-900">
            {question.analysis}
          </p>
        </div>
      )}

      {/* 填空/简答自评 */}
      {!isObjective && isCorrect === null && (
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm text-muted-foreground">对照参考答案，你的回答是否正确？</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => onSelfGrade(true)}
            >
              <CheckCircle2 className="mr-1.5 size-4" />
              我答对了
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => onSelfGrade(false)}
            >
              <XCircle className="mr-1.5 size-4" />
              我答错了
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
