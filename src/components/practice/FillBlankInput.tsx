import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface FillBlankInputProps {
  value: string
  onChange: (v: string) => void
  revealed: boolean
}

export function FillBlankInput({ value, onChange, revealed }: FillBlankInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">写下你的答案（揭示后可对照参考答案自评）</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入你的答案…"
        rows={4}
        disabled={revealed}
        className="resize-none"
      />
    </div>
  )
}
