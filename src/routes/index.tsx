import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { BanksPage } from '@/pages/BanksPage'
import { BankDetailPage } from '@/pages/BankDetailPage'
import { UploadPage } from '@/pages/UploadPage'
import { PracticePage } from '@/pages/PracticePage'
import { WrongBookPage } from '@/pages/WrongBookPage'
import { StatsPage } from '@/pages/StatsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'banks', element: <BanksPage /> },
      { path: 'banks/:bankId', element: <BankDetailPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'practice/:bankId', element: <PracticePage mode="sequential" /> },
      {
        path: 'practice/:bankId/wrongbook',
        element: <PracticePage mode="wrongbook" />,
      },
      { path: 'wrongbook', element: <WrongBookPage /> },
      { path: 'stats', element: <StatsPage /> },
    ],
  },
])
