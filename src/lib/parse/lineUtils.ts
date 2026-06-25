// PDF 行重建：pdfjs 的 textContent items 带坐标，直接拼接会丢失换行。
// 按 Y 坐标分组为同一行，行内按 X 升序，行间按 Y 降序（从上到下）。

interface TextItem {
  str: string
  transform: number[] // [a, b, c, d, e, f] 其中 e=x, f=y
  hasEOL?: boolean
}

const Y_TOLERANCE = 3 // 像素容差

export function reconstructLines(items: unknown[]): string[] {
  const validItems = (items as TextItem[]).filter(
    (it) => it && typeof it.str === 'string' && it.str.length > 0,
  )
  if (validItems.length === 0) return []

  // 按 Y 坐标分组
  const groups: Array<{ y: number; items: TextItem[] }> = []
  for (const it of validItems) {
    const y = it.transform[5]
    const grp = groups.find((g) => Math.abs(g.y - y) <= Y_TOLERANCE)
    if (grp) {
      grp.items.push(it)
    } else {
      groups.push({ y, items: [it] })
    }
  }

  // 行内按 X 升序
  groups.forEach((g) => g.items.sort((a, b) => a.transform[4] - b.transform[4]))

  // 行间按 Y 降序（页面坐标 Y 向上为正，所以从大到小 = 从上到下）
  groups.sort((a, b) => b.y - a.y)

  // 拼接每行文本，处理行内空格
  return groups.map((g) => {
    let line = ''
    let prevEndX = -Infinity
    for (const it of g.items) {
      const x = it.transform[4]
      // 如果与前一个 item 间距较大，补一个空格
      if (prevEndX !== -Infinity && x - prevEndX > 1) {
        // 仅当当前行不以空格结尾且新片段不以空格开头时补
        if (!line.endsWith(' ') && !it.str.startsWith(' ')) {
          line += ' '
        }
      }
      line += it.str
      prevEndX = x + it.str.length * (it.transform[0] || 6)
    }
    return line.trim()
  })
}

// 去除页眉页脚噪声：若某些短行在多页重复出现，视为页眉页脚
export function stripRepeatingLines(pages: string[][]): string[][] {
  const lineFreq = new Map<string, number>()
  for (const page of pages) {
    for (const line of page) {
      const trimmed = line.trim()
      if (trimmed.length > 0 && trimmed.length < 40) {
        lineFreq.set(trimmed, (lineFreq.get(trimmed) ?? 0) + 1)
      }
    }
  }
  const noise = new Set<string>()
  for (const [line, freq] of lineFreq) {
    if (freq >= 3) noise.add(line) // 出现3次以上的短行视为页眉页脚
  }
  return pages.map((page) => page.filter((line) => !noise.has(line.trim())))
}
