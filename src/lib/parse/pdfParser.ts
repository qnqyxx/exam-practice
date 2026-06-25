import * as pdfjsLib from 'pdfjs-dist'
import { reconstructLines, stripRepeatingLines } from './lineUtils'
import type { ProgressCb } from './types'

// Vite 下 worker 配置（关键，否则报错）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export async function extractPdfText(
  file: File,
  onProgress?: ProgressCb,
): Promise<string> {
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const pages: string[][] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const lines = reconstructLines(content.items)
    pages.push(lines)
    onProgress?.(i / pdf.numPages)
  }

  // 去页眉页脚噪声
  const cleaned = stripRepeatingLines(pages)
  return cleaned.map((p) => p.join('\n')).join('\n')
}

// 检测是否为扫描件（无可提取文本）
export async function isScannedPdf(file: File): Promise<boolean> {
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  let totalText = 0
  const checkPages = Math.min(pdf.numPages, 3)
  for (let i = 1; i <= checkPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    for (const item of content.items) {
      if (typeof (item as { str?: string }).str === 'string') {
        totalText += (item as { str: string }).str.trim().length
      }
    }
  }
  // 前3页总字符不足 50，基本是扫描件
  return totalText < 50
}
