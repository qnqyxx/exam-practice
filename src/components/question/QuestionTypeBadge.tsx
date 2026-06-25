import { Badge } from '@/components/ui/badge'
import { QuestionType, QUESTION_TYPE_LABELS } from '@/types/enums'
import { cn } from '@/lib/utils'

const typeStyles: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: 'bg-blue-50 text-blue-700 border-blue-200',
  [QuestionType.MultipleChoice]: 'bg-violet-50 text-violet-700 border-violet-200',
  [QuestionType.TrueFalse]: 'bg-amber-50 text-amber-700 border-amber-200',
  [QuestionType.FillBlank]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  return (
    <Badge variant="outline" className={cn('font-medium', typeStyles[type])}>
      {QUESTION_TYPE_LABELS[type]}
    </Badge>
  )
}
