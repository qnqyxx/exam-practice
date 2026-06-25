import { cn } from '@/lib/utils'
import type { Option } from '@/types'

interface MultipleChoiceInputProps {
  options: Option[]
  value: string // 如 "ACD"
  onChange: (v: string) => void
  revealed: boolean
  correctAnswer: string
}

export function MultipleChoiceInput({
  options,
  value,
  onChange,
  revealed,
  correctAnswer,
}: MultipleChoiceInputProps) {
  const selected = new Set(value.split(''))

  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange([...next].sort().join(''))
  }

  const correctSet = new Set(correctAnswer.split(''))

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = selected.has(opt.key)
        const isCorrect = revealed && correctSet.has(opt.key)
        const isWrong = revealed && isSelected && !correctSet.has(opt.key)
        return (
          <button
            key={opt.key}
            disabled={revealed}
            onClick={() => toggle(opt.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
              isSelected && !revealed && 'border-primary bg-primary/5',
              isCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-900',
              isWrong && 'border-red-500 bg-red-50 text-red-900',
              !isSelected && !isCorrect && !isWrong && 'border-border hover:bg-accent',
              revealed && !isCorrect && !isWrong && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded border text-sm',
                isSelected && 'border-primary bg-primary text-primary-foreground',
                isCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                isWrong && 'border-red-500 bg-red-500 text-white',
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
