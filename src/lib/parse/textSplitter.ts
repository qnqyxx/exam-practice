import { nanoid } from 'nanoid'
import { QuestionType } from '@/types/enums'
import type { Option } from '@/types'
import {
  RE_QNUM,
  RE_QNUM_P,
  RE_TYPE_HEADER,
  RE_ANSWER_LINE,
  RE_ANSWER,
  RE_ANALYSIS,
  RE_KNOWLEDGE,
  splitInlineFields,
} from './patterns'
import {
  parseOptionLine,
  matchAnswerLine,
  matchAnalysisLine,
  matchKnowledgeLine,
  findInlineAnswer,
  inferType,
  normalizeAnswer,
  detectTypeHint,
} from './questionDetector'
import type { ParsedQuestion } from './types'

interface Block {
  order: number
  lines: string[]
  typeHint: string | null
}

interface RawQuestion {
  order: number
  stem: string
  options: Option[]
  answer: string
  analysis: string
  knowledgePoint: string
  typeHint: string | null
}

// Pass 1: 按题号切块
function splitIntoBlocks(text: string): { blocks: Block[]; unparsed: string[] } {
  const lines = text.split('\n')
  const blocks: Block[] = []
  const unparsed: string[] = []
  let currentBlock: Block | null = null
  let currentTypeHint: string | null = null
  let order = 0

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // 检测题型小标题（独立行）
    if (RE_TYPE_HEADER.test(line)) {
      const hint = detectTypeHint(line)
      if (hint) {
        currentTypeHint = hint
        // 如果当前有未关闭的 block，先收尾
        if (currentBlock && currentBlock.lines.length > 0) {
          blocks.push(currentBlock)
        }
        currentBlock = null
      }
      continue
    }

    // 检测题号起始
    const isQuestionStart = RE_QNUM.test(line) || RE_QNUM_P.test(line)

    if (isQuestionStart) {
      // 关闭上一个 block
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock)
      }
      order++
      currentBlock = { order, lines: [line], typeHint: currentTypeHint }
    } else if (currentBlock) {
      currentBlock.lines.push(line)
    } else {
      // 题号之前的孤立行
      unparsed.push(line)
    }
  }
  // 收尾
  if (currentBlock && currentBlock.lines.length > 0) {
    blocks.push(currentBlock)
  }

  return { blocks, unparsed }
}

// Pass 2: block 内字段识别（重写，正确处理 answer/analysis/knowledgePoint 与一行多字段）
function parseBlock(block: Block): RawQuestion {
  const lines = block.lines
  let stem = ''
  const options: Option[] = []
  let answer = ''
  let analysis = ''
  let knowledgePoint = ''
  // 状态机：stem → options → analysis → knowledgePoint
  // （遇到答案行后默认进入 analysis 模式，等待可能的解析/知识点标记）
  // 任何字段标记出现后，无标记的后续行归入"当前字段"
  let mode: 'stem' | 'options' | 'analysis' | 'knowledgePoint' = 'stem'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 去题号前缀（用于题干续行）
    const cleanedLine = line.replace(RE_QNUM, '').replace(RE_QNUM_P, '').trim()

    // 1) 答案标记行（独立行：答案：A）
    const ansMatch = matchAnswerLine(line)
    if (ansMatch !== null) {
      // 答案值里可能还夹带了解析/知识点（如 "A。解析：xxx。知识点：yyy"）
      // leadingField='answer'：开头到第一个字段标记之前的裸值（如 "A"）归入 answer
      const inline = splitInlineFields(ansMatch, 'answer')
      answer = inline.answer ?? ansMatch.trim()
      if (inline.analysis) {
        analysis = inline.analysis
        mode = 'analysis'
      }
      if (inline.knowledgePoint) {
        knowledgePoint = inline.knowledgePoint
        mode = 'knowledgePoint'
      }
      if (!inline.analysis && !inline.knowledgePoint) {
        mode = 'analysis' // 答案后默认进入解析模式，等待可能的解析行
      }
      continue
    }

    // 2) 解析标记行
    const analysisMatch = matchAnalysisLine(line)
    if (analysisMatch !== null) {
      // 解析值里可能夹带知识点；解析前不会有 answer 裸值（因为这是解析行）
      const inline = splitInlineFields(analysisMatch, 'analysis')
      analysis = inline.analysis ?? analysisMatch.trim()
      if (inline.knowledgePoint) {
        knowledgePoint = inline.knowledgePoint
        mode = 'knowledgePoint'
      } else {
        mode = 'analysis'
      }
      continue
    }

    // 3) 知识点标记行
    const knowledgeMatch = matchKnowledgeLine(line)
    if (knowledgeMatch !== null) {
      knowledgePoint = knowledgeMatch
      mode = 'knowledgePoint'
      continue
    }

    // 4) 选项行（只在 stem/options 模式下识别，避免把解析里的 "A. xxx" 误判为选项）
    const opt = parseOptionLine(line)
    if (opt && (mode === 'stem' || mode === 'options')) {
      options.push(opt)
      mode = 'options'
      continue
    }

    // 5) 按当前模式累积
    if (mode === 'stem') {
      stem += (stem ? '\n' : '') + cleanedLine
    } else if (mode === 'options') {
      if (opt) {
        // 不太可能到这里（前面已 continue），保留兜底
        options.push(opt)
      } else if (options.length > 0) {
        // 选项续行
        options[options.length - 1].text += ' ' + cleanedLine
      } else {
        stem += (stem ? '\n' : '') + cleanedLine
      }
    } else if (mode === 'analysis') {
      analysis += (analysis ? '\n' : '') + line
    } else if (mode === 'knowledgePoint') {
      knowledgePoint += (knowledgePoint ? '\n' : '') + line
    }
  }

  // 内联答案兜底：题干中可能藏 "答案：A"
  if (!answer) {
    const inline = findInlineAnswer(stem)
    if (inline) {
      // 题干里的答案后可能还跟了解析
      const fields = splitInlineFields(inline)
      answer = fields.answer ?? inline
      if (fields.analysis) analysis = fields.analysis
      if (fields.knowledgePoint) knowledgePoint = fields.knowledgePoint
      // 从题干中移除 "答案：..." 片段
      stem = stem.replace(/答案\s*[:：]\s*[^\n]+/, '').trim()
    }
  }

  // 答案中可能残留分隔符，清理
  answer = answer.replace(/[。；;.\s]+$/, '').trim()
  stem = stem.trim()
  analysis = analysis.trim()
  knowledgePoint = knowledgePoint.trim()

  return {
    order: block.order,
    stem,
    options,
    answer,
    analysis,
    knowledgePoint,
    typeHint: block.typeHint,
  }
}

// 文末集中答案处理
function applyTrailingAnswers(
  raws: RawQuestion[],
  unparsedLines: string[],
): void {
  // 检查是否所有题都没有内联答案
  const allMissing = raws.every((r) => !r.answer)
  if (!allMissing) return

  // 从 unparsedLines 和文末扫描答案区
  const answerMap = new Map<number, string>()
  for (const line of unparsedLines) {
    const m = line.match(RE_ANSWER_LINE)
    if (m) {
      const num = parseNumber(m[1])
      if (num) answerMap.set(num, m[2].trim())
    }
  }

  if (answerMap.size === 0) return

  for (const raw of raws) {
    const ans = answerMap.get(raw.order)
    if (ans) raw.answer = ans
  }
}

function parseNumber(s: string): number | null {
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  // 中文数字
  const map: Record<string, number> = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  }
  if (s.length === 1 && map[s]) return map[s]
  if (s.length === 2 && s[0] === '十') return 10 + (map[s[1]] ?? 0)
  if (s.length === 2 && s[1] === '十') return (map[s[0]] ?? 0) * 10
  return null
}

// 组装 ParsedQuestion + 置信度
function assemble(raw: RawQuestion): ParsedQuestion {
  const { type, confidence: typeConf } = inferType(
    raw.stem,
    raw.options,
    raw.answer,
    raw.typeHint ?? undefined,
  )
  const answer = normalizeAnswer(raw.answer, type)
  const warnings: string[] = []

  let confidence = 0.3

  if (raw.stem) confidence += 0.3
  if (answer) confidence += 0.3
  confidence = Math.min(confidence + typeConf * 0.3, 1)
  // 解析和知识点是加分项，但不强制
  if (raw.analysis) confidence = Math.min(confidence + 0.05, 1)

  let needsReview = false

  if (!raw.stem) {
    warnings.push('题干为空')
    needsReview = true
    confidence = Math.min(confidence, 0.2)
  }
  if (!answer) {
    warnings.push('未识别到答案')
    needsReview = true
    confidence = Math.min(confidence, 0.4)
  }
  // 选择题选项数量检查
  if (
    (type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice) &&
    raw.options.length < 2
  ) {
    warnings.push('选项数量不足')
    needsReview = true
    confidence = Math.min(confidence, 0.5)
  }
  // 多选但答案只有1个字母
  if (type === QuestionType.MultipleChoice && answer.length < 2) {
    warnings.push('多选题答案仅一个选项，请核对')
    needsReview = true
  }
  // 提示：未识别到解析/知识点（不强制 review，仅提示）
  if (!raw.analysis && !raw.knowledgePoint) {
    warnings.push('未识别到解析/知识点')
  }

  if (confidence < 0.8) needsReview = true

  return {
    tempId: nanoid(),
    type,
    stem: raw.stem,
    options: raw.options,
    answer,
    analysis: raw.analysis,
    knowledgePoint: raw.knowledgePoint,
    order: raw.order,
    confidence: Math.round(confidence * 100) / 100,
    needsReview,
    warnings,
  }
}

export function splitText(text: string): {
  questions: ParsedQuestion[]
  unparsedText: string
} {
  const { blocks, unparsed } = splitIntoBlocks(text)

  if (blocks.length === 0) {
    return { questions: [], unparsedText: unparsed.join('\n') }
  }

  const raws = blocks.map(parseBlock)
  applyTrailingAnswers(raws, unparsed)
  const questions = raws.map(assemble)

  return {
    questions,
    unparsedText: unparsed.join('\n'),
  }
}

// 重新导出 patterns 的部分常量，便于外部测试
export { RE_ANSWER, RE_ANALYSIS, RE_KNOWLEDGE }

