import { useLocation } from 'react-router-dom'

const titleMap: Record<string, string> = {
  '/': '首页',
  '/banks': '题库管理',
  '/upload': '导入文档',
  '/wrongbook': '错题本',
  '/stats': '学习统计',
}

export function Header() {
  const { pathname } = useLocation()
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
    </header>
  )
}
