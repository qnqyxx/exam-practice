import { Keyboard } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const shortcuts = [
  { key: 'A B C D', desc: '选择选项' },
  { key: 'Space', desc: '显示答案' },
  { key: '← →', desc: '上/下一题' },
  { key: 'Y / N', desc: '我对了 / 我错了' },
]

export function KeyboardHint() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
            <Keyboard className="size-3.5" />
            快捷键
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-44">
          <div className="space-y-1.5">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="font-mono text-[11px] text-foreground">{s.key}</span>
                <span className="text-muted-foreground">{s.desc}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
