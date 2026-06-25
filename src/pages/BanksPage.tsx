import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Upload, Play, MoreVertical, Trash2, Download, Pencil, Library } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useBanks } from '@/hooks/useBanks'
import { exportBank } from '@/lib/io/exporter'
import type { QuestionBank } from '@/types'

export function BanksPage() {
  const { banks, loading, createBank, deleteBank, updateBank } = useBanks()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editTarget, setEditTarget] = useState<QuestionBank | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuestionBank | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('请输入题库名称')
      return
    }
    const bank = await createBank({ name: newName.trim(), description: newDesc.trim() || undefined })
    toast.success('题库已创建')
    setCreateOpen(false)
    setNewName('')
    setNewDesc('')
    navigate(`/banks/${bank.id}`)
  }

  const handleEdit = async () => {
    if (!editTarget) return
    if (!editTarget.name.trim()) {
      toast.error('请输入题库名称')
      return
    }
    await updateBank(editTarget.id, { name: editTarget.name, description: editTarget.description })
    toast.success('已更新')
    setEditTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteBank(deleteTarget.id)
    toast.success(`已删除「${deleteTarget.name}」`)
    setDeleteTarget(null)
  }

  const handleExport = async (bank: QuestionBank) => {
    try {
      await exportBank(bank.id)
      toast.success('题库已导出')
    } catch {
      toast.error('导出失败')
    }
  }

  const renderCreateDialog = () => (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建题库</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>题库名称</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="如：计算机网络期末复习"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>描述（可选）</Label>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="简单描述这个题库"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            取消
          </Button>
          <Button onClick={handleCreate}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (!loading && banks.length === 0) {
    return (
      <PageContainer>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">题库管理</h2>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            新建题库
          </Button>
        </div>
        <EmptyState
          icon={<Library className="size-12" />}
          title="还没有题库"
          description="新建一个题库，或直接上传文档自动生成"
          action={
            <div className="flex gap-3">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 size-4" />
                新建题库
              </Button>
              <Button variant="outline" asChild>
                <Link to="/upload">
                  <Upload className="mr-1 size-4" />
                  导入文档
                </Link>
              </Button>
            </div>
          }
        />
        {renderCreateDialog()}
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">题库管理</h2>
          <p className="mt-1 text-sm text-muted-foreground">共 {banks.length} 个题库</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 size-4" />
          新建题库
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {banks.map((bank) => (
          <Card key={bank.id} className="group transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link to={`/banks/${bank.id}`} className="block">
                    <h3 className="truncate text-base font-semibold hover:text-primary">
                      {bank.name}
                    </h3>
                  </Link>
                  {bank.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {bank.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{bank.questionCount}</span> 题
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 shrink-0">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditTarget({ ...bank })}>
                      <Pencil className="mr-2 size-3.5" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(bank)}>
                      <Download className="mr-2 size-3.5" />
                      导出
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(bank)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link to={`/banks/${bank.id}`}>
                    查看题目
                  </Link>
                </Button>
                {bank.questionCount > 0 && (
                  <Button size="sm" className="flex-1" asChild>
                    <Link to={`/practice/${bank.id}`}>
                      <Play className="mr-1 size-3.5" />
                      开始练习
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {renderCreateDialog()}

      {/* 编辑弹窗 */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名题库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>题库名称</Label>
              <Input
                value={editTarget?.name ?? ''}
                onChange={(e) =>
                  setEditTarget((t) => (t ? { ...t, name: e.target.value } : t))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>描述（可选）</Label>
              <Input
                value={editTarget?.description ?? ''}
                onChange={(e) =>
                  setEditTarget((t) => (t ? { ...t, description: e.target.value } : t))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除题库"
        description={`确定要删除「${deleteTarget?.name}」吗？题库下所有题目、练习记录和错题都将被永久删除，此操作不可撤销。`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
      />
    </PageContainer>
  )
}
