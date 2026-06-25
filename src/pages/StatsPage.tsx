import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { BarChart3, TrendingUp, Target, FileQuestion, Award } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  useDashboardStats,
  useAccuracyTrend,
  useBankProgress,
  useTypeDistribution,
} from '@/hooks/useStats'
import { QuestionType, QUESTION_TYPE_LABELS } from '@/types/enums'

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']

export function StatsPage() {
  const { stats, loading } = useDashboardStats()
  const trend = useAccuracyTrend(30)
  const bankProgress = useBankProgress()
  const typeDist = useTypeDistribution()

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (!stats || stats.totalQuestions === 0) {
    return (
      <PageContainer>
        <h2 className="mb-6 text-2xl font-bold tracking-tight">学习统计</h2>
        <EmptyState
          icon={<BarChart3 className="size-12" />}
          title="暂无统计数据"
          description="开始练习后，这里会展示你的学习进度和正确率趋势"
        />
      </PageContainer>
    )
  }

  const pieData = Object.entries(typeDist).map(([k, v]) => ({
    name: QUESTION_TYPE_LABELS[k as QuestionType] ?? k,
    value: v,
  }))

  return (
    <PageContainer>
      <h2 className="mb-6 text-2xl font-bold tracking-tight">学习统计</h2>

      {/* 指标卡 */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard icon={<FileQuestion />} label="题目总数" value={stats.totalQuestions} color="text-blue-600 bg-blue-50" />
        <MetricCard icon={<Target />} label="整体正确率" value={`${Math.round(stats.overallAccuracy * 100)}%`} color="text-emerald-600 bg-emerald-50" />
        <MetricCard icon={<Award />} label="连续练习" value={`${stats.streakDays} 天`} color="text-amber-600 bg-amber-50" />
        <MetricCard icon={<TrendingUp />} label="今日练习" value={`${stats.practicedToday} 题`} color="text-violet-600 bg-violet-50" />
      </div>

      {/* 正确率趋势 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">正确率趋势（近 30 天）</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">还没有练习记录</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <RTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, '正确率']}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 题库进度 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">题库练习进度</CardTitle>
          </CardHeader>
          <CardContent>
            {bankProgress.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bankProgress} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="总题数" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="practiced" name="已练习" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 题型分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">题型分布</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(e) => `${e.name}: ${e.value}`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function MetricCard({
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
