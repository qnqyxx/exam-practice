import { cn } from '@/lib/utils'
import type { Option } from '@/types'

interface ChoiceInputProps {
  options: Option[]
  value: string
  onChange: (v: string) => void
  revealed: boolean
  correctAnswer: string
}

export function SingleChoiceInput({ options, value, onChange, revealed, correctAnswer }: ChoiceInputProps) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value === opt.key
        const isCorrect = revealed && opt.key === correctAnswer
        const isWrong = revealed && selected && opt.key !== correctAnswer
        return (
          <button
            key={opt.key}
            disabled={revealed}
            onClick={() => onChange(opt.key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
              selected && !revealed && 'border-primary bg-primary/5',
              isCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-900',
              isWrong && 'border-red-500 bg-red-50 text-red-900',
              !selected && !isCorrect && !isWrong && 'border-border hover:bg-accent',
              revealed && !isCorrect && !isWrong && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                selected && 'border-primary bg-primary text-primary-foreground',
                isCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                isWrong && 'border-red-500 bg-red-500 text-white',
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
