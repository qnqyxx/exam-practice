import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="text-6xl font-bold text-muted-foreground/30">404</div>
      <p className="text-lg font-medium">页面不存在</p>
      <p className="text-sm text-muted-foreground">你访问的页面可能已被移除或地址有误</p>
      <Button asChild className="mt-2">
        <Link to="/">返回首页</Link>
      </Button>
    </div>
  )
}
