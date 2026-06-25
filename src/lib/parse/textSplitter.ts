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
  RE_SUB_BLANK_HEADER,
  RE_SUB_BLANK_HYPHEN,
  RE_SUB_ANSWER_LINE,
  RE_ANSWER_SUMMARY,
  RE_SUMMARY_PAIR,
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
  // ── 分空选择题专用 ──
  parentGroupId?: string   // 同一父题的所有子空共享同一 nanoid
  blankLabel?: string      // 如 "第1空" / "(1)" / "17-1"
  blankIndex?: number      // 空号数字（1,2,3...）
  typeOverride?: QuestionType  // 强制题型（分空用）
}

// 子空段（用于 detectSubBlanks）
interface SubBlankSpan {
  startIndex: number    // 子空标题行在 block.lines 中的索引
  endIndex: number      // 该子空段的结束索引（不含）
  blankIndex: number    // 空号
  label: string         // "第1空" / "17-1"
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

// ────────────────────────────────────────────────────────────
// 分空选择题解析：检测子空 → 拆分 → 组装独立 RawQuestion
// ────────────────────────────────────────────────────────────

/**
 * 检测一个 block 是否为分空题，返回子空段列表。
 * 判定条件（满足任一即认为分空题）：
 *   1) block 内 RE_SUB_BLANK_HEADER 匹配 >= 2 次
 *   2) block 内 RE_SUB_ANSWER_LINE 匹配 >= 2 次（无"第X空"标题但有 (1)B (2)C 答案行）
 *   3) block 内 RE_SUB_BLANK_HYPHEN 匹配 >= 2 次（17-1/17-2 格式）
 */
function detectSubBlanks(block: Block, parentNum?: number): SubBlankSpan[] | null {
  const lines = block.lines
  const spans: SubBlankSpan[] = []

  // 收集所有子空标题行位置
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let m = line.match(RE_SUB_BLANK_HEADER)
    if (m) {
      const idx = parseNumber(m[1]) ?? (spans.length + 1)
      spans.push({ startIndex: i, endIndex: lines.length, blankIndex: idx, label: `第${idx}空` })
      continue
    }
    m = line.match(RE_SUB_BLANK_HYPHEN)
    if (m) {
      const pNum = parseInt(m[1], 10)
      // 仅当连字符前缀与父题号一致时才认作子空
      if (parentNum !== undefined && pNum === parentNum) {
        const idx = parseInt(m[2], 10)
        spans.push({ startIndex: i, endIndex: lines.length, blankIndex: idx, label: `${pNum}-${idx}` })
      }
    }
  }

  // 若无标题行，退而用答案行定位
  if (spans.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(RE_SUB_ANSWER_LINE)
      if (m) {
        const idx = parseInt(m[1], 10)
        spans.push({ startIndex: i, endIndex: lines.length, blankIndex: idx, label: `(${idx})` })
      }
    }
  }

  if (spans.length < 2) {
    // 单空或零空：单空也按分空走统一路径
    if (spans.length === 1) return spans
    return null
  }

  // 计算 endIndex：每个 span 的结束 = 下一个 span 的起始
  // 但要先扣除共享尾部（解析/知识点/汇总）
  const sharedTailStart = findSharedTailStart(lines, spans[spans.length - 1].startIndex)
  for (let i = 0; i < spans.length; i++) {
    spans[i].endIndex = i + 1 < spans.length ? spans[i + 1].startIndex : sharedTailStart
  }
  return spans
}

/**
 * 找共享尾部起点：从最后一个子空标题往后，
 * 第一个匹配 RE_ANALYSIS / RE_KNOWLEDGE / RE_ANSWER_SUMMARY 的行
 */
function findSharedTailStart(lines: string[], fromIdx: number): number {
  for (let i = fromIdx; i < lines.length; i++) {
    if (
      RE_ANALYSIS.test(lines[i]) ||
      RE_KNOWLEDGE.test(lines[i]) ||
      RE_ANSWER_SUMMARY.test(lines[i])
    ) {
      return i
    }
  }
  return lines.length
}

/**
 * 解析分空块 → N 个独立的 RawQuestion（每空有自己 options + answer，共享 analysis/knowledgePoint）
 */
function parseSubBlankBlock(block: Block, spans: SubBlankSpan[]): RawQuestion[] {
  const groupId = nanoid()
  const raws: RawQuestion[] = []

  // 1) 提取父题干：第一个子空标题之前的所有行
  const firstSubStart = spans[0].startIndex
  const parentStemLines = block.lines.slice(0, firstSubStart)
  let parentStem = parentStemLines
    .map((l) => l.replace(RE_QNUM, '').replace(RE_QNUM_P, '').trim())
    .filter(Boolean)
    .join('\n')
    .trim()

  // 2) 提取共享尾部（解析/知识点/汇总）
  const tailStart = spans[spans.length - 1].endIndex
  const tailLines = block.lines.slice(tailStart)
  let sharedAnalysis = ''
  let sharedKnowledge = ''
  const summaryMap = new Map<number, string>() // 空号 → 答案

  for (const line of tailLines) {
    // 答案汇总行
    const sm = line.match(RE_ANSWER_SUMMARY)
    if (sm) {
      let pm: RegExpExecArray | null
      RE_SUMMARY_PAIR.lastIndex = 0
      while ((pm = RE_SUMMARY_PAIR.exec(sm[1] ?? '')) !== null) {
        summaryMap.set(parseInt(pm[1], 10), pm[2].trim())
      }
      continue
    }
    // 解析标记行
    const am = matchAnalysisLine(line)
    if (am !== null) {
      sharedAnalysis = sharedAnalysis ? sharedAnalysis + '\n' + am : am
      continue
    }
    // 知识点标记行
    const km = matchKnowledgeLine(line)
    if (km !== null) {
      sharedKnowledge = sharedKnowledge ? sharedKnowledge + '\n' + km : km
      continue
    }
    // 续行归入当前字段
    if (sharedKnowledge) {
      sharedKnowledge += '\n' + line
    } else if (sharedAnalysis) {
      sharedAnalysis += '\n' + line
    }
  }

  // 3) 逐子空解析
  for (const span of spans) {
    const subLines = block.lines.slice(span.startIndex, span.endIndex)
    const options: Option[] = []
    let answer = ''

    for (const line of subLines) {
      // 子空标题行本身跳过
      if (RE_SUB_BLANK_HEADER.test(line) || RE_SUB_BLANK_HYPHEN.test(line)) continue

      // 子空答案行：答案：(1)B  →  提取 B
      const sa = line.match(RE_SUB_ANSWER_LINE)
      if (sa) {
        answer = sa[2].trim()
        continue
      }
      // 通用答案行兜底
      const am = matchAnswerLine(line)
      if (am !== null) {
        const stripped = am.replace(/^[（(]\s*\d+\s*[)）]\s*/, '').trim()
        answer = stripped || am
        continue
      }
      // 选项行
      const opt = parseOptionLine(line)
      if (opt) {
        options.push(opt)
        continue
      }
    }

    // 汇总兜底：若该子空没解析到答案，从 summaryMap 取
    if (!answer && summaryMap.has(span.blankIndex)) {
      answer = summaryMap.get(span.blankIndex)!
    }

    // 4) 构建子空题干
    const subStem = buildSubBlankStem(parentStem, span.blankIndex, span.label)

    raws.push({
      order: 0, // 后续 renumber 统一分配
      stem: subStem,
      options,
      answer,
      analysis: sharedAnalysis,
      knowledgePoint: sharedKnowledge,
      typeHint: block.typeHint,
      parentGroupId: groupId,
      blankLabel: span.label,
      blankIndex: span.blankIndex,
      typeOverride:
        options.length >= 2 ? QuestionType.SingleChoice : QuestionType.FillBlank,
    })
  }

  return raws
}

/**
 * 构建子空题干：将父题干中对应 (blankIndex) 替换为 〔第N空〕，
 * 其余空引用保持原样。若未找到对应空引用则追加标识。
 */
function buildSubBlankStem(
  parentStem: string,
  blankIndex: number,
  label: string,
): string {
  const targetPattern = new RegExp(
    `[（(]\\s*${blankIndex}\\s*[)）]`,
  )
  // 先检查是否存在（test 后 replace 会消耗 lastIndex）
  const hasTarget = targetPattern.test(parentStem)
  if (hasTarget) {
    // 重新执行替换（因为 test 已经消耗了 lastIndex... 实际上非 global 不影响）
    return parentStem.replace(targetPattern, `〔${label}〕`)
  }
  // 未找到对应空引用，追加标识
  return `${parentStem}\n\n【${label}】`
}
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
  // 分空题强制题型 + 高置信度（跳过 inferType）
  const { type, confidence: typeConf } = raw.typeOverride
    ? { type: raw.typeOverride, confidence: 0.9 }
    : inferType(raw.stem, raw.options, raw.answer, raw.typeHint ?? undefined)
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
    // 分空选择题字段透传
    parentGroupId: raw.parentGroupId,
    blankLabel: raw.blankLabel,
    blankIndex: raw.blankIndex,
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

  // 解析每个 block：分空题走 parseSubBlankBlock，普通题走 parseBlock
  const raws: RawQuestion[] = []
  for (const block of blocks) {
    // 提取父题号（用于 17-1 格式匹配）
    const qnumMatch = block.lines[0]?.match(RE_QNUM) || block.lines[0]?.match(RE_QNUM_P)
    const parentNum = qnumMatch
      ? (parseNumber(qnumMatch[1]) ?? undefined)
      : undefined

    const spans = detectSubBlanks(block, parentNum)
    if (spans && spans.length >= 1) {
      raws.push(...parseSubBlankBlock(block, spans))
    } else {
      raws.push(parseBlock(block))
    }
  }

  // 重新编号（分空拆出的子空需要连续编号）
  raws.forEach((r, i) => { r.order = i + 1 })

  applyTrailingAnswers(raws, unparsed)
  const questions = raws.map(assemble)

  return {
    questions,
    unparsedText: unparsed.join('\n'),
  }
}

// 重新导出 patterns 的部分常量，便于外部测试
export { RE_ANSWER, RE_ANALYSIS, RE_KNOWLEDGE }

