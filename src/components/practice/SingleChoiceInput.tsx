import { cn } from '@/lib/utils'
import type { Option } from '@/types'

interface ChoiceInputProps {
  options: Option[]
  value: string
  onChange: (v: string) => void
  revealed: boolean
  correctAnswer: string
  displayOrder?: string[]
}

export function SingleChoiceInput({ options, value, onChange, revealed, correctAnswer, displayOrder }: ChoiceInputProps) {
  const orderedOptions = displayOrder
    ? displayOrder
        .map((k) => options.find((o) => o.key === k))
        .filter((o): o is NonNullable<typeof o> => !!o)
    : [...options].sort((a, b) => a.key.localeCompare(b.key))
  return (
    <div className="space-y-2">
      {orderedOptions.map((opt) => {
        const selected = value === opt.key
        const isCorrect = revealed && opt.key === correctAnswer
        const isWrong = revealed && selected && opt.key !== correctAnswer
        return (
          <button
            key={opt.key}
            disabled={revealed}
            onClick={() => onChange(opt.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all hover:border-primary/50 hover:bg-accent/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              selected && !revealed && 'border-primary bg-primary/5',
              isCorrect && 'border-success bg-success/10 text-success-foreground',
              isWrong && 'border-destructive bg-destructive/10 text-destructive',
              !selected && !isCorrect && !isWrong && 'border-border',
              revealed && !isCorrect && !isWrong && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                selected && 'border-primary bg-primary text-primary-foreground',
                isCorrect && 'border-success bg-success text-success-foreground',
                isWrong && 'border-destructive bg-destructive text-white',
              )}
            >
              {opt.key}
            </span>
            <span className="flex-1">{opt.text}</span>
          </button>
        )
      })}
    </div>
  )
}
