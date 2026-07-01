import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Library, Upload, BookX, BarChart3, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: '首页', icon: LayoutDashboard, end: true },
  { to: '/banks', label: '题库', icon: Library },
  { to: '/upload', label: '导入文档', icon: Upload },
  { to: '/wrongbook', label: '错题本', icon: BookX },
  { to: '/stats', label: '统计', icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">考试刷题</div>
          <div className="text-xs text-muted-foreground leading-tight">复习练习平台</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4 text-xs text-muted-foreground">
        <p>数据存储于本地浏览器</p>
        <p className="mt-1">关闭浏览器不会丢失</p>
      </div>
    </aside>
  )
}
