import { useState, useCallback } from 'react'
import { UploadCloud, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadDropzoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

const ACCEPTED = '.pdf,.docx,.txt'

export function UploadDropzone({ onFiles, disabled }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(pdf|docx|txt)$/i.test(f.name),
      )
      if (files.length) onFiles(files)
    },
    [onFiles, disabled],
  )

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <input
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="size-7" />
      </div>
      <p className="text-sm font-medium">点击或拖拽文件到此处</p>
      <p className="mt-1 text-xs text-muted-foreground">支持 PDF、Word(.docx)、TXT</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="size-3.5" />
        可同时选择多个文件
      </div>
    </label>
  )
}
