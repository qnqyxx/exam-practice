import { Progress } from '@/components/ui/progress'

interface ParseProgressProps {
  progress: number // 0-100
  fileName?: string
}

export function ParseProgress({ progress, fileName }: ParseProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border py-12">
      <div className="mb-4 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm font-medium">
        {fileName ? `正在解析 ${fileName}` : '正在解析文档…'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">提取题目并智能识别题型、答案、解析</p>
      <div className="mt-4 w-64">
        <Progress value={progress} className="h-2" />
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  )
}
