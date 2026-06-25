import { useEffect } from 'react'
import { QuestionType } from '@/types/enums'

interface ShortcutHandlers {
  onReveal?: () => void
  onNext?: () => void
  onPrev?: () => void
  onCorrect?: () => void
  onWrong?: () => void
  onChoice?: (key: string) => void
  enabled: boolean
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    if (!handlers.enabled) return
    const handler = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlers.onReveal?.()
          break
        case 'ArrowRight':
          handlers.onNext?.()
          break
        case 'ArrowLeft':
          handlers.onPrev?.()
          break
        case 'KeyJ':
          handlers.onNext?.()
          break
        case 'KeyK':
          handlers.onPrev?.()
          break
        case 'KeyY':
          handlers.onCorrect?.()
          break
        case 'KeyN':
          handlers.onWrong?.()
          break
        default:
          // A/B/C/D 选项
          if (/^Key[A-Z]$/.test(e.code)) {
            handlers.onChoice?.(e.code.replace('Key', ''))
          }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlers])
}

export { QuestionType }
