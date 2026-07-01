import { Badge } from '@/components/ui/badge'
import { QuestionType, QUESTION_TYPE_LABELS } from '@/types/enums'
import { cn } from '@/lib/utils'

const typeStyles: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: 'bg-info/10 text-info-foreground border-info/30',
  [QuestionType.MultipleChoice]: 'bg-primary/10 text-primary border-primary/30',
  [QuestionType.TrueFalse]: 'bg-warning/10 text-warning-foreground border-warning/30',
  [QuestionType.FillBlank]: 'bg-success/10 text-success-foreground border-success/30',
}

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  return (
    <Badge variant="outline" className={cn('font-medium', typeStyles[type])}>
      {QUESTION_TYPE_LABELS[type]}
    </Badge>
  )
}
