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
              'flex items-center justify-center gap-2 rounded-lg border py-6 text-base font-medium transition-colors',
              selected && !revealed && 'border-primary bg-primary/5',
              isCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-900',
              isWrong && 'border-red-500 bg-red-50 text-red-900',
              !selected && !isCorrect && !isWrong && 'border-border hover:bg-accent',
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
