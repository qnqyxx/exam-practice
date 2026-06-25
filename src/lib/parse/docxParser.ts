import type { ProgressCb } from './types'

export async function extractDocxText(
  file: File,
  _onProgress?: ProgressCb,
): Promise<string> {
  // 动态 import 减小首屏体积
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value // 段落换行已保留
}

export function isDocx(file: File): boolean {
  return file.name.toLowerCase().endsWith('.docx')
}

export function isOldDoc(file: File): boolean {
  return file.name.toLowerCase().endsWith('.doc')
}
