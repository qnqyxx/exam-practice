import { Link } from 'react-router-dom'
import { Library, Upload, FileQuestion, TrendingUp, Flame, Target, ArrowRight } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useDashboardStats } from '@/hooks/useStats'
import { useBanks } from '@/hooks/useBanks'

export function DashboardPage() {
  const { stats, loading } = useDashboardStats()
  const { banks } = useBanks()

  if (loading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </PageContainer>
    )
  }

  const isEmpty = (stats?.totalQuestions ?? 0) === 0

  return (
    <PageContainer>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">欢迎回来 👋</h2>
        <p className="mt-1 text-muted-foreground">坚持练习，稳步提升</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<FileQuestion className="size-5" />}
          label="题目总数"
          value={stats?.totalQuestions ?? 0}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          icon={<Library className="size-5" />}
          label="题库数量"
          value={stats?.totalBanks ?? 0}
          color="text-violet-600 bg-violet-50"
        />
        <StatCard
          icon={<Target className="size-5" />}
          label="整体正确率"
          value={`${Math.round((stats?.overallAccuracy ?? 0) * 100)}%`}
          color="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          icon={<Flame className="size-5" />}
          label="连续练习"
          value={`${stats?.streakDays ?? 0} 天`}
          color="text-amber-600 bg-amber-50"
        />
      </div>

      {isEmpty ? (
        <EmptyState
          className="mt-8"
          icon={<Upload className="size-12" />}
          title="还没有题目，开始导入吧"
          description="上传你的 PDF / Word 复习资料，系统会自动提取题目并整理成题库"
          action={
            <Button asChild>
              <Link to="/upload">
                <Upload className="mr-2 size-4" />
                导入文档
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">最近题库</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/banks">
                查看全部
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {banks.slice(0, 4).map((bank) => (
              <Link
                key={bank.id}
                to={`/banks/${bank.id}`}
                className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{bank.name}</div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{bank.questionCount} 题</span>
                  <span>·</span>
                  <span>{bank.description || '未设描述'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Card className="mt-8 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            快捷入口
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/upload">
              <Upload className="mr-2 size-4" />
              导入文档
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/banks">
              <Library className="mr-2 size-4" />
              管理题库
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/wrongbook">错题本</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/stats">学习统计</Link>
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`mb-3 flex size-10 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
