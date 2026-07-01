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
          'rounded-lg border border-l-4 p-4',
          isCorrect === true && 'border-success/40 border-l-success bg-success/15',
          isCorrect === false && 'border-destructive/40 border-l-destructive bg-destructive/15',
          isCorrect === null && 'border-border border-l-muted-foreground/40 bg-muted/30',
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {isCorrect === true && <CheckCircle2 className="size-4 text-success" />}
          {isCorrect === false && <XCircle className="size-4 text-destructive" />}
          正确答案
        </div>
        <p className="mt-1.5 text-lg font-semibold">{question.answer}</p>
        {isObjective && userAnswer && (
          <p className="mt-1 text-sm text-muted-foreground">
            你的选择：
            <span className={isCorrect ? 'text-success' : 'text-destructive'}>
              {userAnswer}
            </span>
          </p>
        )}
      </div>

      {/* 知识点 */}
      {question.knowledgePoint && (
        <div className="rounded-lg border border-l-4 border-info/30 border-l-info bg-info/15 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-info">
            <Bookmark className="size-4" />
            知识点
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-info-foreground">
            {question.knowledgePoint}
          </p>
        </div>
      )}

      {/* 解析 */}
      {question.analysis && (
        <div className="rounded-lg border border-l-4 border-warning/30 border-l-warning bg-warning/15 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-warning">
            <Lightbulb className="size-4" />
            解析
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-warning-foreground">
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
              className="flex-1 border-success/40 text-success hover:bg-success/10"
              onClick={() => onSelfGrade(true)}
            >
              <CheckCircle2 className="mr-1.5 size-4" />
              我答对了
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
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
