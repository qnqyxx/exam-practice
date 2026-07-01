import { RouterProvider } from 'react-router-dom'
import { createBrowserRouter, createHashRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { BanksPage } from '@/pages/BanksPage'
import { BankDetailPage } from '@/pages/BankDetailPage'
import { UploadPage } from '@/pages/UploadPage'
import { PracticePage } from '@/pages/PracticePage'
import { ExamResultPage } from '@/pages/ExamResultPage'
import { WrongBookPage } from '@/pages/WrongBookPage'
import { StatsPage } from '@/pages/StatsPage'
import { Toaster } from '@/components/ui/sonner'
import { useUIStore } from '@/store/uiStore'

// 路由配置
const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'banks', element: <BanksPage /> },
      { path: 'banks/:bankId', element: <BankDetailPage /> },
      { path: 'upload', element: <UploadPage /> },
      {
        path: 'practice/:bankId',
        element: <PracticePage mode="sequential" />,
      },
      {
        path: 'practice/:bankId/wrongbook',
        element: <PracticePage mode="wrongbook" />,
      },
      {
        path: 'practice/:bankId/random',
        element: <PracticePage mode="random" />,
      },
      {
        path: 'practice/:bankId/type/:qtype',
        element: <PracticePage mode="random" />,
      },
      {
        path: 'practice/:bankId/exam',
        element: <PracticePage mode="exam" />,
      },
      {
        path: 'practice/:bankId/exam/result',
        element: <ExamResultPage />,
      },
      { path: 'wrongbook', element: <WrongBookPage /> },
      { path: 'stats', element: <StatsPage /> },
    ],
  },
]

interface AppProps {
  isFileProtocol?: boolean
}

function App({ isFileProtocol }: AppProps) {
  // file:// 协议不支持 HTML5 History API → 用 HashRouter
  // http/https 协式 → 用 BrowserRouter（配合 Vercel SPA rewrites）
  const router = isFileProtocol
    ? createHashRouter(routes)
    : createBrowserRouter(routes)

  const theme = useUIStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch (e) {
      /* 忽略存储异常 */
    }
  }, [theme])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
