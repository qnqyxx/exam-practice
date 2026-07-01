import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookX, Play, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useWrongBook } from '@/hooks/useWrongBook'

export function WrongBookPage() {
  const navigate = useNavigate()
  const { byBank, bankMap, total, markMastered, removeWrong, clearMastered } = useWrongBook()
  const [clearOpen, setClearOpen] = useState(false)

  if (total === 0) {
    return (
      <PageContainer>
        <h2 className="mb-6 text-2xl font-bold tracking-tight">错题本</h2>
        <EmptyState
          icon={<BookX className="size-12" />}
          title="暂无错题"
          description="练习中答错的题目会自动收录到这里，方便针对性复习"
          action={
            <Button variant="outline" onClick={() => navigate('/banks')}>
              去练习
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const handleClear = async () => {
    await clearMastered()
    toast.success('已清除已掌握的错题')
    setClearOpen(false)
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">错题本</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 道错题待掌握，分布在 {byBank.size} 个题库
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setClearOpen(true)}>
          <Trash2 className="mr-1 size-3.5" />
          清除已掌握
        </Button>
      </div>

      <div className="space-y-6">
        {[...byBank.entries()].map(([bankId, wrongs]) => {
          const bank = bankMap.get(bankId)
          return (
            <Card key={bankId}>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{bank?.name ?? '未知题库'}</h3>
                    <p className="text-sm text-muted-foreground">{wrongs.length} 道错题</p>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/practice/${bankId}/wrongbook`)}>
                    <Play className="mr-1 size-3.5" />
                    错题重练
                  </Button>
                </div>

                <div className="space-y-2">
                  {wrongs.map((w) => {
                    return (
                      <div
                        key={w.id}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="bg-destructive/10 text-destructive">
                            错 {w.wrongCount} 次
                          </Badge>
                          <span className="text-muted-foreground">
                            最后答错：{new Date(w.lastWrongAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-success hover:bg-success/10"
                            onClick={async () => {
                              await markMastered(w.questionId)
                              toast.success('已标记为掌握')
                            }}
                            title="标记掌握"
                          >
                            <Check className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              await removeWrong(w.questionId)
                              toast.success('已移除')
                            }}
                            title="移除"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="清除已掌握的错题"
        description="已掌握的错题将从错题本中清除，此操作不可撤销。"
        confirmText="清除"
        destructive
        onConfirm={handleClear}
      />
    </PageContainer>
  )
}
