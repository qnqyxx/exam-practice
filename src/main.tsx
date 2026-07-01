import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// file:// 协议不支持 HTML5 History API，自动降级为 HashRouter
const isFileProtocol = typeof window !== 'undefined' && window.location?.protocol === 'file:'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App isFileProtocol={isFileProtocol} />
  </StrictMode>,
)
