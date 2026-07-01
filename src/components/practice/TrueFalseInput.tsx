import { cn } from '@/lib/utils'

interface TrueFalseInputProps {
  value: string
  onChange: (v: string) => void
  revealed: boolean
  correctAnswer: string
}

export function TrueFalseInput({ value, onChange, revealed, correctAnswer }: TrueFalseInputProps) {
  const options = [
    { key: 'T', label: '正确' },
    { key: 'F', label: '错误' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
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
              'flex items-center justify-center gap-2 rounded-lg border py-6 text-base font-medium transition-all hover:border-primary/50 hover:bg-accent/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              selected && !revealed && 'border-primary bg-primary/5',
              isCorrect && 'border-success bg-success/10 text-success-foreground',
              isWrong && 'border-destructive bg-destructive/10 text-destructive',
              !selected && !isCorrect && !isWrong && 'border-border',
              revealed && !isCorrect && !isWrong && 'opacity-60',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
