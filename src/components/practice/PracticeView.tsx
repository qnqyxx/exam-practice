import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, FileQuestion } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { KeyboardHint } from '@/components/common/KeyboardHint'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { QuestionTypeBadge } from '@/components/question/QuestionTypeBadge'
import { SingleChoiceInput } from './SingleChoiceInput'
import { MultipleChoiceInput } from './MultipleChoiceInput'
import { TrueFalseInput } from './TrueFalseInput'
import { FillBlankInput } from './FillBlankInput'
import { AnswerReveal } from './AnswerReveal'
import { usePracticeStore } from '@/store/practiceStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { addRecord } from '@/lib/db/practiceRecords.repo'
import { upsertWrong, markMastered } from '@/lib/db/wrongQuestions.repo'
import { playSound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { QuestionType } from '@/types/enums'
import type { Question } from '@/types'

interface PracticeViewProps {
  questions: Question[]
  bankId: string
  mode: 'sequential' | 'wrongbook' | 'random' | 'exam'
  onExit: () => void
  displayOrderMap?: Record<string, string[]>
  examConfig?: { durationSec: number; deadline: number }
}

export function PracticeView({ questions, bankId, mode, onExit, displayOrderMap, examConfig }: PracticeViewProps) {
  const { session, startSession, endSession, next, prev, reveal, setUserAnswer, setResult, setExamAnswer } =
    usePracticeStore()
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const navigate = useNavigate()

  // 初始化或题目变化时重启会话
  useEffect(() => {
    if (questions.length > 0) {
      const existing = usePracticeStore.getState().session
      // 如果题库和模式相同且会话仍有效，则续练；
      // 允许题目列表因「掌握」而缩短（questions.length <= existing.questions.length），不重启会话
      if (
        existing &&
        existing.bankId === bankId &&
        existing.mode === mode &&
        mode !== 'exam' && // exam 不续练（有 deadline）
        existing.currentIndex < existing.questions.length &&
        questions.length <= existing.questions.length
      ) {
        return
      }
      startSession(bankId, mode, questions, examConfig)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, bankId, mode])

  const current = session?.questions[session.currentIndex]
  const total = session?.questions.length ?? 0
  const idx = session?.currentIndex ?? 0

  const isObjective = useMemo(
    () =>
      current &&
      (current.type === QuestionType.SingleChoice ||
        current.type === QuestionType.MultipleChoice ||
        current.type === QuestionType.TrueFalse),
    [current],
  )

  const isExam = mode === 'exam'
  const [submitOpen, setSubmitOpen] = useState(false)
  const [remaining, setRemaining] = useState<number>(0)

  // exam 模式当前题用户答案从 session.answers 取
  const examUserAnswer =
    isExam && session ? (session.answers?.[current?.id ?? ''] ?? '') : (session?.userAnswer ?? '')

  // 客观题自动判分
  const gradeObjective = (q: Question, userAns: string): boolean => {
    return q.answer.toUpperCase() === userAns.toUpperCase()
  }

  const handleReveal = () => {
    if (!session || !current) return
    if (!session.revealed) {
      reveal()
      // 客观题自动判分
      if (isObjective && session.userAnswer) {
        const correct = gradeObjective(current, session.userAnswer)
        setResult(correct)
        submitRecord(correct)
      }
    } else {
      // 已揭示，空格跳到下一题
      handleNext()
    }
  }

  const submitRecord = async (correct: boolean) => {
    if (!current || !session) return
    if (soundEnabled) {
      playSound(correct ? 'correct' : 'wrong')
    }
    await addRecord({
      questionId: current.id,
      bankId,
      isCorrect: correct,
      userAnswer: session.userAnswer,
      practicedAt: Date.now(),
      sessionType: mode,
    })
    if (!correct) {
      await upsertWrong(current.id, bankId)
    }
    // 错题本模式下答对不再立即标记掌握，改为用户查看解析后点击「下一题」时再标记（见 handleNext）
  }

  const handleSelfGrade = (correct: boolean) => {
    setResult(correct)
    submitRecord(correct)
    toast(correct ? '已记录：答对' : '已加入错题本')
  }

  const handleNext = async () => {
    if (!session || !current) return
    // 错题本模式：用户查看解析后点击「下一题 / 完成」时，才将该题从错题本移除
    const shouldMaster =
      mode === 'wrongbook' && session.revealed && session.isCorrect === true
    if (idx < total - 1) {
      if (shouldMaster) {
        await markMastered(current.id)
      }
      next()
    } else {
      toast.success('已完成全部题目！')
      endSession()
      onExit()
      // 末题情形：导航后再标记掌握，避免错题列表实时缩短造成界面闪烁
      if (shouldMaster) {
        void markMastered(current.id)
      }
    }
  }

  const handlePrev = () => {
    if (session && idx > 0) prev()
  }

  const handleChoice = (key: string) => {
    if (!session || !current) return
    if (isExam) {
      if (current.type === QuestionType.SingleChoice) {
        setExamAnswer(current.id, key)
      } else if (current.type === QuestionType.MultipleChoice) {
        const prevAns = session.answers?.[current.id] ?? ''
        const selected = new Set(prevAns.split('').filter(Boolean))
        if (selected.has(key)) selected.delete(key)
        else selected.add(key)
        setExamAnswer(current.id, [...selected].sort().join(''))
      } else if (current.type === QuestionType.TrueFalse) {
        setExamAnswer(current.id, key === 'A' ? 'T' : 'F')
      }
      return
    }
    if (session.revealed) return
    if (current.type === QuestionType.SingleChoice) {
      setUserAnswer(key)
    } else if (current.type === QuestionType.MultipleChoice) {
      const selected = new Set(session.userAnswer.split(''))
      if (selected.has(key)) selected.delete(key)
      else selected.add(key)
      setUserAnswer([...selected].sort().join(''))
    } else if (current.type === QuestionType.TrueFalse) {
      // A=T, B=F
      setUserAnswer(key === 'A' ? 'T' : 'F')
    }
  }

  // exam 交卷（使用 store 最新状态，避免 stale closure）
  const handleExamSubmit = async () => {
    const s = usePracticeStore.getState().session
    if (!s) return
    setSubmitOpen(false)
    const qs = s.questions
    const answers = s.answers ?? {}
    const results = qs.map((q) => {
      const ua = answers[q.id] ?? ''
      let correct: boolean | null = null
      if (
        q.type === QuestionType.SingleChoice ||
        q.type === QuestionType.MultipleChoice ||
        q.type === QuestionType.TrueFalse
      ) {
        correct = ua.toUpperCase() === q.answer.toUpperCase() && ua !== ''
      } else {
        correct = null // 填空待自评
      }
      return { q, userAnswer: ua, correct }
    })
    // 批量写记录
    await Promise.all(
      results.map((r) => {
        if (r.correct !== null) {
          return addRecord({
            questionId: r.q.id,
            bankId,
            isCorrect: r.correct,
            userAnswer: r.userAnswer,
            practicedAt: Date.now(),
            sessionType: 'exam',
          }).then(() => {
            if (!r.correct) return upsertWrong(r.q.id, bankId)
          })
        }
        return Promise.resolve()
      }),
    )
    const usedSec =
      s.durationSec && s.deadline
        ? Math.min(
            s.durationSec,
            Math.max(0, s.durationSec - Math.ceil((s.deadline - Date.now()) / 1000)),
          )
        : 0
    const payload = {
      bankId,
      questions: qs,
      userAnswers: answers,
      results: results.map((r) => ({ questionId: r.q.id, userAnswer: r.userAnswer, correct: r.correct })),
      durationSec: s.durationSec ?? 0,
      usedSec,
    }
    endSession()
    navigate(`/practice/${bankId}/exam/result`, { state: payload })
  }

  // exam 倒计时
  useEffect(() => {
    if (!isExam || !session?.deadline) return
    const tick = () => {
      const r = Math.max(0, Math.ceil((session.deadline! - Date.now()) / 1000))
      setRemaining(r)
      if (r <= 0) {
        void handleExamSubmit()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExam, session?.deadline])

  const handleExamSubmitConfirm = () => setSubmitOpen(true)

  const handleExamNext = () => {
    if (!session || !current) return
    if (idx < total - 1) next()
    else handleExamSubmitConfirm() // 末题点交卷
  }

  useKeyboardShortcuts({
    enabled: !!session,
    onReveal: isExam ? undefined : handleReveal,
    onNext: isExam ? handleExamNext : handleNext,
    onPrev: handlePrev,
    onCorrect: isExam ? undefined : () => session?.revealed && !isObjective && handleSelfGrade(true),
    onWrong: isExam ? undefined : () => session?.revealed && !isObjective && handleSelfGrade(false),
    onChoice: handleChoice,
  })

  if (!session || !current) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-6">
        <EmptyState
          className="mt-10"
          icon={<FileQuestion className="size-12" />}
          title="没有可练习的题目"
          description="该题库暂无题目，或错题本为空"
          action={
            <Button onClick={onExit}>返回</Button>
          }
        />
      </div>
    )
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* 顶部进度条 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            第 {idx + 1} / {total} 题
          </span>
          <div className="flex items-center gap-3">
            {isExam ? (
              <span className={cn('font-mono font-semibold', remaining < 60 && 'text-destructive')}>
                {mm}:{ss}
              </span>
            ) : (
              <span className="text-muted-foreground">{Math.round(((idx + 1) / total) * 100)}%</span>
            )}
            <KeyboardHint />
            <Button variant="ghost" size="sm" onClick={() => { endSession(); onExit() }}>
              退出
            </Button>
          </div>
        </div>
        <Progress value={((idx + 1) / total) * 100} className="h-2" />
      </div>

      {/* 题目卡片 */}
      <div key={idx} className="animate-question-in">
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <QuestionTypeBadge type={current.type} />
            <span className="text-xs text-muted-foreground">第 {current.order + 1} 题</span>
          </div>

          <p className="mb-5 text-[17px] leading-8">{current.stem}</p>

          {/* 作答区 */}
          {isExam ? (
            <>
              {current.type === QuestionType.SingleChoice && (
                <SingleChoiceInput
                  options={current.options}
                  value={examUserAnswer}
                  onChange={(k) => handleChoice(k)}
                  revealed={false}
                  correctAnswer={current.answer}
                  displayOrder={displayOrderMap?.[current.id]}
                />
              )}
              {current.type === QuestionType.MultipleChoice && (
                <MultipleChoiceInput
                  options={current.options}
                  value={examUserAnswer}
                  onChange={(k) => handleChoice(k)}
                  revealed={false}
                  correctAnswer={current.answer}
                  displayOrder={displayOrderMap?.[current.id]}
                />
              )}
              {current.type === QuestionType.TrueFalse && (
                <TrueFalseInput
                  value={examUserAnswer}
                  onChange={(k) => setExamAnswer(current.id, k)}
                  revealed={false}
                  correctAnswer={current.answer}
                />
              )}
              {current.type === QuestionType.FillBlank && (
                <FillBlankInput
                  value={examUserAnswer}
                  onChange={(v) => setExamAnswer(current.id, v)}
                  revealed={false}
                />
              )}
            </>
          ) : (
            <>
              {!session.revealed && (
                <>
                  {current.type === QuestionType.SingleChoice && (
                    <SingleChoiceInput
                      options={current.options}
                      value={session.userAnswer}
                      onChange={setUserAnswer}
                      revealed={false}
                      correctAnswer={current.answer}
                      displayOrder={displayOrderMap?.[current.id]}
                    />
                  )}
                  {current.type === QuestionType.MultipleChoice && (
                    <MultipleChoiceInput
                      options={current.options}
                      value={session.userAnswer}
                      onChange={setUserAnswer}
                      revealed={false}
                      correctAnswer={current.answer}
                      displayOrder={displayOrderMap?.[current.id]}
                    />
                  )}
                  {current.type === QuestionType.TrueFalse && (
                    <TrueFalseInput
                      value={session.userAnswer}
                      onChange={setUserAnswer}
                      revealed={false}
                      correctAnswer={current.answer}
                    />
                  )}
                  {current.type === QuestionType.FillBlank && (
                    <FillBlankInput
                      value={session.userAnswer}
                      onChange={setUserAnswer}
                      revealed={false}
                    />
                  )}
                </>
              )}

              {/* 揭示后锁定显示 + 答案区 */}
              {session.revealed && (
                <>
                  {current.type === QuestionType.SingleChoice && (
                    <SingleChoiceInput
                      options={current.options}
                      value={session.userAnswer}
                      onChange={() => {}}
                      revealed
                      correctAnswer={current.answer}
                      displayOrder={displayOrderMap?.[current.id]}
                    />
                  )}
                  {current.type === QuestionType.MultipleChoice && (
                    <MultipleChoiceInput
                      options={current.options}
                      value={session.userAnswer}
                      onChange={() => {}}
                      revealed
                      correctAnswer={current.answer}
                      displayOrder={displayOrderMap?.[current.id]}
                    />
                  )}
                  {current.type === QuestionType.TrueFalse && (
                    <TrueFalseInput
                      value={session.userAnswer}
                      onChange={() => {}}
                      revealed
                      correctAnswer={current.answer}
                    />
                  )}
                  {current.type === QuestionType.FillBlank && (
                    <FillBlankInput value={session.userAnswer} onChange={() => {}} revealed />
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>

      {/* 答案揭示区（exam 模式 session.revealed 恒为 false，不显示） */}
      {session.revealed && (
        <div className="mb-4">
          <AnswerReveal
            question={current}
            userAnswer={session.userAnswer}
            isCorrect={session.isCorrect}
            onSelfGrade={handleSelfGrade}
          />
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between">
        {isExam ? (
          <>
            <Button variant="outline" onClick={handlePrev} disabled={idx === 0}>
              <ArrowLeft className="mr-1 size-4" /> 上一题
            </Button>
            <div className="flex gap-2">
              {idx < total - 1 ? (
                <Button onClick={handleExamNext}>
                  下一题 <ArrowRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button onClick={handleExamSubmitConfirm}>
                  交卷
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handlePrev} disabled={idx === 0}>
              <ArrowLeft className="mr-1 size-4" />
              上一题
            </Button>

            <div className="flex gap-2">
              {!session.revealed ? (
                <Button onClick={handleReveal} disabled={!session.userAnswer && isObjective}>
                  <Eye className="mr-1.5 size-4" />
                  显示答案
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {idx < total - 1 ? '下一题' : '完成'}
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="确认交卷"
        description={
          isExam
            ? `还有 ${total - Object.keys(session?.answers ?? {}).length} 题未作答，确定交卷吗？`
            : '确定交卷吗？'
        }
        confirmText="交卷"
        onConfirm={handleExamSubmit}
      />
    </div>
  )
}
