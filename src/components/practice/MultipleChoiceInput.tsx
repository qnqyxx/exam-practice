import { cn } from '@/lib/utils'
import type { Option } from '@/types'

interface MultipleChoiceInputProps {
  options: Option[]
  value: string // 如 "ACD"
  onChange: (v: string) => void
  revealed: boolean
  correctAnswer: string
  displayOrder?: string[]
}

export function MultipleChoiceInput({
  options,
  value,
  onChange,
  revealed,
  correctAnswer,
  displayOrder,
}: MultipleChoiceInputProps) {
  const selected = new Set(value.split(''))

  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange([...next].sort().join(''))
  }

  const correctSet = new Set(correctAnswer.split(''))
  const orderedOptions = displayOrder
    ? displayOrder
        .map((k) => options.find((o) => o.key === k))
        .filter((o): o is NonNullable<typeof o> => !!o)
    : [...options].sort((a, b) => a.key.localeCompare(b.key))

  return (
    <div className="space-y-2">
      {orderedOptions.map((opt) => {
        const isSelected = selected.has(opt.key)
        const isCorrect = revealed && correctSet.has(opt.key)
        const isWrong = revealed && isSelected && !correctSet.has(opt.key)
        return (
          <button
            key={opt.key}
            disabled={revealed}
            onClick={() => toggle(opt.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all hover:border-primary/50 hover:bg-accent/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isSelected && !revealed && 'border-primary bg-primary/5',
              isCorrect && 'border-success bg-success/10 text-success-foreground',
              isWrong && 'border-destructive bg-destructive/10 text-destructive',
              !isSelected && !isCorrect && !isWrong && 'border-border',
              revealed && !isCorrect && !isWrong && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md border text-sm',
                isSelected && 'border-primary bg-primary text-primary-foreground',
                isCorrect && 'border-success bg-success text-success-foreground',
                isWrong && 'border-destructive bg-destructive text-white',
              )}
            >
              {isSelected ? '✓' : ''}
            </span>
            <span className="font-medium text-muted-foreground">{opt.key}.</span>
            <span className="flex-1">{opt.text}</span>
          </button>
        )
      })}
    </div>
  )
}
