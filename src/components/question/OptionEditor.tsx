import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Option } from '@/types'

interface OptionEditorProps {
  options: Option[]
  onChange: (options: Option[]) => void
}

export function OptionEditor({ options, onChange }: OptionEditorProps) {
  const updateText = (key: string, text: string) => {
    onChange(options.map((o) => (o.key === key ? { ...o, text } : o)))
  }
  const remove = (key: string) => {
    onChange(options.filter((o) => o.key !== key))
  }
  const add = () => {
    const nextKey = String.fromCharCode(65 + options.length)
    onChange([...options, { key: nextKey, text: '' }])
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <div key={opt.key} className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">
            {opt.key}
          </span>
          <Input
            value={opt.text}
            onChange={(e) => updateText(opt.key, e.target.value)}
            placeholder="选项内容"
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(opt.key)}
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="mt-1">
        <Plus className="mr-1 size-3.5" />
        添加选项
      </Button>
    </div>
  )
}
