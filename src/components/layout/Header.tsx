import { useLocation } from 'react-router-dom'
import { Sun, Moon, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useSettingsStore } from '@/store/settingsStore'

const titleMap: Record<string, string> = {
  '/': '首页',
  '/banks': '题库管理',
  '/upload': '导入文档',
  '/wrongbook': '错题本',
  '/stats': '学习统计',
}

export function Header() {
  const { pathname } = useLocation()
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const { soundEnabled, toggleSound } = useSettingsStore()
  let title = '首页'
  for (const key of Object.keys(titleMap)) {
    if (key !== '/' && pathname.startsWith(key)) {
      title = titleMap[key]
      break
    }
    if (pathname === '/') title = titleMap['/']
  }
  if (pathname.includes('/banks/') && pathname !== '/banks') title = '题库详情'
  if (pathname.includes('/practice/')) title = '练习中'
  if (pathname.includes('/wrongbook') && pathname !== '/wrongbook') title = '错题重练'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          title={soundEnabled ? '关闭音效' : '开启音效'}
          aria-label={soundEnabled ? '关闭音效' : '开启音效'}
        >
          {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="切换主题"
          aria-label="切换主题"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  )
}
