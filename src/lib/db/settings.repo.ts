import { db } from './database'
import type { Settings } from '@/types'

const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  theme: 'light',
  revealMode: 'manual',
  shortcutsEnabled: true,
}

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('app')
  return s ?? DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, id: 'app' })
}

export async function initSettings(): Promise<void> {
  const s = await db.settings.get('app')
  if (!s) {
    await db.settings.put(DEFAULT_SETTINGS)
  }
}
