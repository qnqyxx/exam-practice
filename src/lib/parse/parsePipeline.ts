import { QuestionType } from '@/types/enums'
import { extractPdfText, isScannedPdf } from './pdfParser'
import { extractDocxText, isDocx, isOldDoc } from './docxParser'
import { splitText } from './textSplitter'
import type { ParseResult, ProgressCb } from './types'

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export async function extractTextFromFile(
  file: File,
  onProgress?: ProgressCb,
): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) {
    const scanned = await isScannedPdf(file)
    if (scanned) {
      throw new ParseError(
        '该 PDF 似乎是扫描件（无可提取文字层），暂不支持。请使用 .docx 文档或先用 OCR 处理。',
      )
    }
    return extractPdfText(file, onProgress)
  }
  if (isDocx(file)) {
    return extractDocxText(file, onProgress)
  }
  if (isOldDoc(file)) {
    throw new ParseError('不支持旧版 .doc 格式，请另存为 .docx 后再上传。')
  }
  if (name.endsWith('.txt')) {
    return file.text()
  }
  throw new ParseError(`不支持的文件类型：${file.name}`)
}

export function buildParseResult(
  questions: ParseResult['questions'],
  unparsedText: string,
): ParseResult {
  const byType: Record<string, number> = {}
  let needsReview = 0
  for (const q of questions) {
    const key = q.type ?? 'unknown'
    byType[key] = (byType[key] ?? 0) + 1
    if (q.needsReview) needsReview++
  }
  return {
    questions,
    unparsedText,
    stats: { total: questions.length, needsReview, byType },
  }
}

export async function parseFile(
  file: File,
  onProgress?: ProgressCb,
): Promise<ParseResult> {
  const text = await extractTextFromFile(file, onProgress)
  const { questions, unparsedText } = splitText(text)
  return buildParseResult(questions, unparsedText)
}

// 合并多个文件的解析结果
export function mergeResults(results: ParseResult[]): ParseResult {
  let orderOffset = 0
  const allQuestions: ParseResult['questions'] = []
  let allUnparsed = ''
  for (const r of results) {
    for (const q of r.questions) {
      allQuestions.push({ ...q, order: q.order + orderOffset })
    }
    allUnparsed += (allUnparsed ? '\n---\n' : '') + r.unparsedText
    orderOffset += r.questions.length
  }
  return buildParseResult(allQuestions, allUnparsed)
}

export { QuestionType }
