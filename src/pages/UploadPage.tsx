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
      {!results && !parsing && (
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
        <Card className="mt-5 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-sm text-amber-800">
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
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span className="font-medium">
                已识别 {results.questions.length} 道题目，请核对后保存
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setResults(null); setError(null) }}>
                重新上传
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-1 size-4" />
                {saving ? '保存中…' : '保存到题库'}
              </Button>
            </div>
          </div>
          <ParsedReviewTable questions={results.questions} onChange={updateQuestions} />
        </div>
      )}

      {/* 空状态 */}
      {!results && !parsing && !error && (
        <Card className="mt-5 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <FileText className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-foreground">支持的文档格式</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                  <li>Word（.docx）— 推荐格式，识别效果最佳</li>
                  <li>PDF（.pdf）— 需有可选文字层，扫描件暂不支持</li>
                  <li>文本（.txt）— 纯文本题目</li>
                </ul>
                <p className="mt-2 text-xs">题目应包含题号（如 1. / 一、），答案可用「答案：」标记，解析可用「解析：」标记。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
