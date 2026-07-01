import { cn } from '@/lib/utils'

interface DayData {
  day: string // YYYY-MM-DD
  total: number
  correct: number
}

interface ActivityHeatmapProps {
  data: DayData[]
}

// 生成近 53 周的日期网格（按周日为列起点，GitHub 风格）
function buildGrid(): { date: Date; key: string }[][] {
  const weeks: { date: Date; key: string }[][] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 找到今日所在周的周日（作为最后一列的末尾）
  const lastSunday = new Date(today)
  lastSunday.setDate(today.getDate() - today.getDay())
  // 回溯 52 周 + 当周 = 53 列
  const start = new Date(lastSunday)
  start.setDate(start.getDate() - 7 * 52)
  for (let w = 0; w < 53; w++) {
    const week: { date: Date; key: string }[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      week.push({ date, key })
    }
    weeks.push(week)
  }
  return weeks
}

function levelClass(total: number): string {
  if (total === 0) return 'bg-muted'
  if (total <= 3) return 'bg-success/30'
  if (total <= 9) return 'bg-success/55'
  if (total <= 19) return 'bg-success/80'
  return 'bg-success'
}

const WEEKDAY_LABELS = ['', '一', '', '三', '', '五', '']
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">暂无练习记录，开始练习后这里会显示你的坚持轨迹</p>
    )
  }

  const map = new Map(data.map((d) => [d.day, d]))
  const weeks = buildGrid()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 月份标签：仅当该列首日月份与前一列不同时显示（GitHub 风格，避免同月重复）
  const monthLabels = weeks.map((week, wi) => {
    const first = week[0].date
    if (first > today) return ''
    if (wi === 0 || weeks[wi - 1][0].date.getMonth() !== first.getMonth()) {
      return MONTH_LABELS[first.getMonth()]
    }
    return ''
  })

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* 月份标签行 */}
        <div className="ml-7 flex gap-[3px] text-[10px] text-muted-foreground">
          {monthLabels.map((m, i) => (
            <div key={i} className="w-3 text-center" style={{ minWidth: '12px' }}>
              {m}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {/* 星期标签列 */}
          <div className="mr-1 flex flex-col gap-[3px] text-[10px] text-muted-foreground">
            {WEEKDAY_LABELS.map((l, i) => (
              <div key={i} className="flex h-3 items-center" style={{ height: '12px' }}>
                {l}
              </div>
            ))}
          </div>
          {/* 网格 */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map(({ date, key }) => {
                  const cell = map.get(key)
                  const total = cell?.total ?? 0
                  const correct = cell?.correct ?? 0
                  const isFuture = date > today
                  return (
                    <div
                      key={key}
                      title={isFuture ? undefined : `${key}：${total} 题（对 ${correct} 题）`}
                      className={cn(
                        'size-3 rounded-sm',
                        isFuture ? 'bg-transparent' : levelClass(total),
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        {/* 图例 */}
        <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>少</span>
          <div className="size-3 rounded-sm bg-muted" />
          <div className="size-3 rounded-sm bg-success/30" />
          <div className="size-3 rounded-sm bg-success/55" />
          <div className="size-3 rounded-sm bg-success/80" />
          <div className="size-3 rounded-sm bg-success" />
          <span>多</span>
        </div>
      </div>
    </div>
  )
}
