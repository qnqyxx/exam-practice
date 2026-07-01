import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { UploadDropzone } from '@/components/upload/UploadDropzone'
import { ParseProgress } from '@/components/upload/ParseProgress'
import { ParsedReviewTable } from '@/components/upload/ParsedReviewTable'
import { useBanks } from '@/hooks/useBanks'
import { useQuestions } from '@/hooks/useQuestions'
import { parseFile, mergeResults, ParseError } from '@/lib/parse/parsePipeline'
import { createBank } from '@/lib/db/banks.repo'
import type { ParsedQuestion, ParseResult } from '@/lib/parse/types'

export function UploadPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetBankId = searchParams.get('bankId')
  const { banks } = useBanks()

  const [selectedBankId, setSelectedBankId] = useState<string>(presetBankId ?? '')
  const [newBankName, setNewBankName] = useState('')
  const [mode, setMode] = useState<'existing' | 'new'>(
    presetBankId ? 'existing' : banks.length > 0 ? 'existing' : 'new',
  )

  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [results, setResults] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { bulkCreate, getNextOrder } = useQuestions(
    mode === 'existing' ? selectedBankId : undefined,
  )

  useEffect(() => {
    if (presetBankId) {
      setSelectedBankId(presetBankId)
      setMode('existing')
    }
  }, [presetBankId])

  const handleFiles = async (files: File[]) => {
    setParsing(true)
    setError(null)
    setProgress(0)
    try {
      const allResults: ParseResult[] = []
      for (let i = 0; i < files.length; i++) {
        setCurrentFile(files[i].name)
        const baseProgress = (i / files.length) * 100
        setProgress(baseProgress)
        const result = await parseFile(files[i], (p) => {
          setProgress(baseProgress + (p / files.length) * 100)
        })
        allResults.push(result)
      }
      setProgress(100)
      const merged = mergeResults(allResults)
      setResults(merged)
      if (merged.questions.length === 0) {
        setError('未能从文档中识别出题目，请检查文档格式或手动添加。')
      } else {
        toast.success(`已识别 ${merged.questions.length} 道题目`)
      }
    } catch (e) {
      if (e instanceof ParseError) {
        setError(e.message)
      } else {
        setError('解析失败：' + (e as Error).message)
      }
    } finally {
      setParsing(false)
      setCurrentFile('')
    }
  }

  const handleSave = async () => {
    if (!results || results.questions.length === 0) return

    let bankId = selectedBankId
    if (mode === 'new') {
      if (!newBankName.trim()) {
        toast.error('请输入题库名称')
        return
      }
      const bank = await createBank({ name: newBankName.trim() })
      bankId = bank.id
    }

    if (!bankId) {
      toast.error('请选择目标题库')
      return
    }

    setSaving(true)
    try {
      const startOrder = await getNextOrder(bankId)
      const items = results.questions.map((q, idx) => ({
        type: q.type!,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis || undefined,
        knowledgePoint: q.knowledgePoint || undefined,
        order: startOrder + idx,
      }))
      const count = await bulkCreate(bankId, items)
      toast.success(`已保存 ${count} 道题目到题库`)
      navigate(`/banks/${bankId}`)
    } catch (e) {
      toast.error('保存失败：' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const updateQuestions = (qs: ParsedQuestion[]) => {
    if (!results) return
    setResults({ ...results, questions: qs })
  }

  return (
    <PageContainer>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/banks">
          <ArrowLeft className="mr-1 size-4" />
          返回
        </Link>
      </Button>

      <h2 className="mb-1 text-2xl font-bold tracking-tight">导入文档</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        上传 PDF / Word 复习资料，系统自动提取题目并识别题型、答案、解析
      </p>

      {/* 选择目标题库 */}
      {!parsing && (
        <Card className="mb-5">
          <CardContent className="p-5">
            <Label className="mb-3 block">目标题库</Label>
            <div className="flex gap-2">
              <Button
                variant={mode === 'existing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('existing')}
                disabled={banks.length === 0}
              >
                已有题库
              </Button>
              <Button
                variant={mode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('new')}
              >
                新建题库
              </Button>
            </div>
            <div className="mt-3">
              {mode === 'existing' ? (
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择题库…" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}（{b.questionCount} 题）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="输入新题库名称"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 上传区 */}
      {!results && !parsing && (
        <UploadDropzone onFiles={handleFiles} />
      )}

      {/* 解析进度 */}
      {parsing && <ParseProgress progress={progress} fileName={currentFile} />}

      {/* 错误提示 */}
      {error && !parsing && (
        <Card className="mt-5 border-warning/30 bg-warning/5">
          <CardContent className="p-4 text-sm text-warning-foreground">
            <p className="font-medium">提示</p>
            <p className="mt-1">{error}</p>
            {results && results.unparsedText && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs">查看未识别文本</summary>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-white/60 p-2 text-xs">
                  {results.unparsedText}
                </pre>
              </details>
            )}
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setError(null); setResults(null) }}>
              重新上传
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 解析结果评审 */}
      {results && results.questions.length > 0 && !parsing && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-5 text-success" />
              <span className="font-medium">
                已识别 {results.questions.length} 道题目，请核对后保存
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setResults(null); setError(null) }}>
                重新上传
              </Button>
              <Button onClick={handleSave} disabled={saving || (mode === 'new' ? !newBankName.trim() : !selectedBankId)}>
                <Save className="mr-1 size-4" />
                {saving ? '保存中…' : '保存到题库'}
              </Button>
            </div>
          </div>
          <ParsedReviewTable questions={results.questions} onChange={updateQuestions} />
        </div>
      )}

      {/* 标准导入格式说明 */}
      {!results && !parsing && !error && (
        <Card className="mt-5 border-dashed">
          <CardContent className="space-y-5 p-5 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <p className="font-medium text-foreground">标准导入格式说明</p>
              <span className="text-xs text-muted-foreground">按以下规范整理文档，可保证题目识别完整</span>
            </div>

            {/* 1. 文件类型 */}
            <div>
              <p className="mb-1 font-medium">1. 支持的文件类型</p>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                <li>Word（.docx）— 推荐格式，识别效果最佳</li>
                <li>文本（.txt）— 纯文本题目，UTF-8 编码</li>
                <li>PDF（.pdf）— 需有可选文字层，扫描件暂不支持；建议优先转为 .docx</li>
              </ul>
            </div>

            {/* 2. 题号格式 */}
            <div>
              <p className="mb-1 font-medium">2. 题号（每题以题号开头，用于切分题目）</p>
              <p className="text-xs text-muted-foreground">支持以下写法：</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`1. 题干内容
1、题干内容
1．题干内容
一、题干内容
一. 题干内容
（一）题干内容
(1) 题干内容
题1. 题干内容`}</pre>
            </div>

            {/* 3. 选项格式 */}
            <div>
              <p className="mb-1 font-medium">3. 选项（每行一个，字母 + 分隔符 + 内容）</p>
              <p className="text-xs text-muted-foreground">分隔符支持 <code>.</code> <code>、</code> <code>．</code> <code>)</code> <code>：</code> <code>:</code></p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`A. 选项一
B、选项二
C) 选项三
D：选项四`}</pre>
            </div>

            {/* 4. 答案 / 解析 / 知识点 */}
            <div>
              <p className="mb-1 font-medium">4. 答案 / 解析 / 知识点标记</p>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                <li>答案标记：答案： / 【答案】 / 正确答案： / 参考答案： / 标准答案：</li>
                <li>解析标记：解析： / 答案解析： / 试题解析： / 分析： / 详解： / 说明：</li>
                <li>知识点标记：知识点： / 考点： / 知识链接： / 相关知识： / 核心考点：</li>
              </ul>
              <p className="mt-1 text-xs text-muted-foreground">三者可独占一行，也可在一行内连写：</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`答案：A。解析：因为……。知识点：第三章`}</pre>
            </div>

            {/* 5. 题型小标题 */}
            <div>
              <p className="mb-1 font-medium">5. 题型小标题（可选，用于批量指定后续题型）</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`一、单选题
二、多选题
三、判断题
四、填空题`}</pre>
              <p className="mt-1 text-xs text-muted-foreground">也可在题干中直接标注（如「（多选）」），系统会据此识别多选题。</p>
            </div>

            {/* 6. 判断题答案 */}
            <div>
              <p className="mb-1 font-medium">6. 判断题答案写法</p>
              <p className="text-xs text-muted-foreground">以下任一均可识别为判断题答案：</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`对 / 错   正确 / 错误   T / F   Y / N   √ / ×   是 / 否   true / false`}</pre>
            </div>

            {/* 7. 填空占位符 */}
            <div>
              <p className="mb-1 font-medium">7. 填空题占位符</p>
              <p className="text-xs text-muted-foreground">题干中用以下符号表示空格，系统会识别为填空题：</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`两个及以上下划线：____
中文/英文空括号：（） / ()`}</pre>
            </div>

            {/* 8. 文末答案区 */}
            <div>
              <p className="mb-1 font-medium">8. 文末集中答案区（可选）</p>
              <p className="text-xs text-muted-foreground">若所有题目均无内联答案，可在文末集中列出，系统会自动匹配：</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`1. A
2、BCD
3. 对`}</pre>
            </div>

            {/* 9. 完整示例 */}
            <div>
              <p className="mb-1 font-medium">9. 完整示例</p>
              <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 text-xs leading-relaxed">{`一、单选题
1. 下列哪项是 JavaScript 的基本数据类型？
A. String
B. Array
C. Object
D. Function
答案：A
解析：String 是基本数据类型，Array/Object/Function 属于引用类型。
知识点：数据类型

二、多选题
2. 以下属于前端框架的有？
A. React
B. Vue
C. Spring
D. Angular
答案：ABD
解析：Spring 是后端框架。

三、判断题
3. HTTP 是无状态协议。
答案：对
解析：HTTP 默认不保留连接状态。

四、填空题
4. HTML 的全称是 ____。
答案：HyperText Markup Language
解析：HTML 即超文本标记语言。`}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
