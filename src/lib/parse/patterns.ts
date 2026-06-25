// 题号：1. / 1、 / 1． / 一、 / 一. / 题1. / （一）
// 捕获组1 = 序号（数字或中文数字）
export const RE_QNUM = /^\s*(?:题?\s*)?(\d+|[一二三四五六七八九十]+)[\.、．]\s*/
export const RE_QNUM_P = /^\s*[（(](\d+|[一二三四五六七八九十]+)[)）]\s*/

// 选项：A. / A、 / A) / A． / A：  捕获组1=字母 组2=文本
export const RE_OPTION = /^\s*([A-Za-z])[\.、．):：]\s*(.+)$/

// 答案标记行：答案：A / 【答案】A / 正确答案: BCD
export const RE_ANSWER =
  /^\s*(?:【?\s*(?:答案|正确答案|参考答案|标准答案)\s*】?)\s*[:：]?\s*(.*)$/
// 内联答案：……答案：A（非行首）
export const RE_ANSWER_INLINE = /答案\s*[:：]\s*([^\n]+)/

// 解析标记行（扩展：解析 / 答案解析 / 试题解析 / 分析 / 详解 / 解释 / 说明 / 答案与解析）
export const RE_ANALYSIS =
  /^\s*(?:【?\s*(?:解析|答案解析|试题解析|分析|详解|解释|说明|答案与解析)\s*】?)\s*[:：]?\s*(.*)$/

// 知识点标记行（知识点 / 考点 / 知识链接 / 相关知识 / 考查知识点 / 涉及知识点）
export const RE_KNOWLEDGE =
  /^\s*(?:【?\s*(?:知识点|考点|知识链接|相关知识|考查知识点|涉及知识点|核心考点)\s*】?)\s*[:：]?\s*(.*)$/

// 题型小标题：单选题 / 二、多选题 / 三、判断题
export const RE_TYPE_HEADER =
  /^\s*(?:[一二三四五六七八九十\d]+[\.、．]\s*)?(单选|多选|判断|填空|简答|名词解释|论述)[题]?\s*(?:题)?\s*$/

// 判断题答案关键词
export const RE_TRUEFALSE_ANSWER = /^(对|错|正确|错误|T|F|Y|N|√|×|是|否|true|false)$/i

// 填空占位
export const RE_BLANK = /_{2,}|（\s*）|\(\s*\)/

// 文末答案区：1. A / 1、BCD / 1. 对
export const RE_ANSWER_LINE =
  /^\s*(\d+|[一二三四五六七八九十]+)[\.、．)]\s*([A-Za-z对错正确错误√×是否TFYN]+.*)$/

// 判断题/答案规范化
export const TRUE_TOKENS = new Set(['对', '正确', 'T', 'Y', '√', '是', 'true'])
export const FALSE_TOKENS = new Set(['错', '错误', 'F', 'N', '×', '否', 'false'])

// ────────────────────────────────────────────────────────────
// 一行内多字段切分：处理 "答案：A。解析：xxx。知识点：yyy" 这类格式
// 返回 { answer?, analysis?, knowledgePoint? }
// ────────────────────────────────────────────────────────────
export interface InlineFields {
  answer?: string
  analysis?: string
  knowledgePoint?: string
}

// 内联字段标记（用于在一段文本中定位字段起始位置）
const FIELD_MARKERS: Array<{
  key: keyof InlineFields
  re: RegExp
}> = [
  // 答案（注意：要放在解析前，避免"答案解析"被解析先吃掉）
  {
    key: 'answer',
    re: /(?:【?\s*(?:正确答案|参考答案|标准答案|答案)\s*】?)\s*[:：]?\s*/,
  },
  // 知识点（放在解析前，因为有时"知识点"也会被解析误吞）
  {
    key: 'knowledgePoint',
    re: /(?:【?\s*(?:考查知识点|涉及知识点|核心考点|知识点|考点|知识链接|相关知识)\s*】?)\s*[:：]?\s*/,
  },
  // 解析
  {
    key: 'analysis',
    re: /(?:【?\s*(?:答案与解析|答案解析|试题解析|解析|分析|详解|解释|说明)\s*】?)\s*[:：]?\s*/,
  },
]

/**
 * 从一段可能含多个字段的文本中切分出 answer / analysis / knowledgePoint。
 * 例如 "答案：A。解析：因为...。知识点：第三章" → { answer:'A', analysis:'因为...', knowledgePoint:'第三章' }
 * 也支持换行分隔（调用前保证 text 是单行或已 join）。
 *
 * leadingField: 当文本开头不是字段标记、而是裸值时（如 "C。解析：xxx"），
 *   把开头到第一个标记之前的内容归入 leadingField 指定的字段。
 *   典型场景：RE_ANSWER 已吃掉"答案："前缀，剩余 "C。解析：xxx" 的开头 "C" 应归入 answer。
 */
export function splitInlineFields(
  text: string,
  leadingField?: keyof InlineFields,
): InlineFields {
  const result: InlineFields = {}
  if (!text || !text.trim()) return result

  // 找出所有字段标记的位置
  const hits: Array<{ key: keyof InlineFields; start: number; markerLen: number }> = []
  for (const { key, re } of FIELD_MARKERS) {
    const m = text.match(re)
    if (m && m.index !== undefined) {
      hits.push({ key, start: m.index, markerLen: m[0].length })
    }
  }
  // 按位置排序
  hits.sort((a, b) => a.start - b.start)

  if (hits.length === 0) {
    // 没有任何标记，整段都是裸值
    if (leadingField) {
      const v = text.replace(/[。；;.\s]+$/, '').trim()
      if (v) result[leadingField] = v
    }
    return result
  }

  // 处理开头的前导裸值（第一个标记之前的内容）
  const firstHit = hits[0]
  if (firstHit.start > 0 && leadingField) {
    const leading = text.slice(0, firstHit.start)
    const v = leading.replace(/[。；;.\s]+$/, '').replace(/^[。；;.\s]+/, '').trim()
    if (v) result[leadingField] = v
  }

  // 每个字段的值 = 从该标记结束到下一个标记开始（或文本结尾），去掉分隔符
  for (let i = 0; i < hits.length; i++) {
    const cur = hits[i]
    const next = hits[i + 1]
    const valueStart = cur.start + cur.markerLen
    const valueEnd = next ? next.start : text.length
    let value = text.slice(valueStart, valueEnd)
    // 去掉尾部的分隔符（句号、分号、换行、空白）
    value = value.replace(/[。；;.\s]+$/, '').replace(/^[。；;.\s]+/, '').trim()
    if (value) result[cur.key] = value
  }

  return result
}

