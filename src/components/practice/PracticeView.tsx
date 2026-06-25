import { useEffect, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Eye, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { KeyboardHint } from '@/components/common/KeyboardHint'
import { QuestionTypeBadge } from '@/components/question/QuestionTypeBadge'
import { SingleChoiceInput } from './SingleChoiceInput'
import { MultipleChoiceInput } from './MultipleChoiceInput'
import { TrueFalseInput } from './TrueFalseInput'
import { FillBlankInput } from './FillBlankInput'
import { AnswerReveal } from './AnswerReveal'
import { usePracticeStore } from '@/store/practiceStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { addRecord } from '@/lib/db/practiceRecords.repo'
import { upsertWrong, markMastered } from '@/lib/db/wrongQuestions.repo'
import { QuestionType } from '@/types/enums'
import type { Question } from '@/types'

interface PracticeViewProps {
  questions: Question[]
  bankId: string
  mode: 'sequential' | 'wrongbook'
  onExit: () => void
}

export function PracticeView({ questions, bankId, mode, onExit }: PracticeViewProps) {
  const { session, startSession, endSession, next, prev, reveal, setUserAnswer, setResult } =
    usePracticeStore()

  // 初始化或题目变化时重启会话
  useEffect(() => {
    if (questions.length > 0) {
      const existing = usePracticeStore.getState().session
      // 如果题库和模式相同且题目集匹配，则续练
      if (
        existing &&
        existing.bankId === bankId &&
        existing.mode === mode &&
        existing.questions.length === questions.length &&
        existing.currentIndex < questions.length
      ) {
        return
      }
      startSession(bankId, mode, questions)
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
    } else if (mode === 'wrongbook') {
      await markMastered(current.id)
    }
  }

  const handleSelfGrade = (correct: boolean) => {
    setResult(correct)
    submitRecord(correct)
    toast(correct ? '已记录：答对' : '已加入错题本')
  }

  const handleNext = () => {
    if (!session) return
    if (idx < total - 1) {
      next()
    } else {
      toast.success('已完成全部题目！')
      endSession()
      onExit()
    }
  }

  const handlePrev = () => {
    if (session && idx > 0) prev()
  }

  const handleChoice = (key: string) => {
    if (!session || !current || session.revealed) return
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

  useKeyboardShortcuts({
    enabled: !!session,
    onReveal: handleReveal,
    onNext: handleNext,
    onPrev: handlePrev,
    onCorrect: () => session?.revealed && !isObjective && handleSelfGrade(true),
    onWrong: () => session?.revealed && !isObjective && handleSelfGrade(false),
    onChoice: handleChoice,
  })

  if (!session || !current) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        加载中…
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>没有可练习的题目</p>
        <Button className="mt-4" onClick={onExit}>
          返回
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* 顶部进度条 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            第 {idx + 1} / {total} 题
          </span>
          <div className="flex items-center gap-3">
            <KeyboardHint />
            <Button variant="ghost" size="sm" onClick={() => { endSession(); onExit() }}>
              退出
            </Button>
          </div>
        </div>
        <Progress value={((idx + 1) / total) * 100} className="h-1.5" />
      </div>

      {/* 题目卡片 */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <QuestionTypeBadge type={current.type} />
            <span className="text-xs text-muted-foreground">第 {current.order + 1} 题</span>
          </div>

          <p className="mb-5 text-[17px] leading-relaxed">{current.stem}</p>

          {/* 作答区 */}
          {!session.revealed && (
            <>
              {current.type === QuestionType.SingleChoice && (
                <SingleChoiceInput
                  options={current.options}
                  value={session.userAnswer}
                  onChange={setUserAnswer}
                  revealed={false}
                  correctAnswer={current.answer}
                />
              )}
              {current.type === QuestionType.MultipleChoice && (
                <MultipleChoiceInput
                  options={current.options}
                  value={session.userAnswer}
                  onChange={setUserAnswer}
                  revealed={false}
                  correctAnswer={current.answer}
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
                />
              )}
              {current.type === QuestionType.MultipleChoice && (
                <MultipleChoiceInput
                  options={current.options}
                  value={session.userAnswer}
                  onChange={() => {}}
                  revealed
                  correctAnswer={current.answer}
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
        </CardContent>
      </Card>

      {/* 答案揭示区 */}
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
            <>
              {isObjective && session.isCorrect !== null && (
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    session.isCorrect
                      ? 'border-emerald-300 text-emerald-600'
                      : 'border-red-300 text-red-600',
                  )}
                  disabled
                >
                  {session.isCorrect ? <Check className="size-4" /> : <X className="size-4" />}
                </Button>
              )}
              <Button onClick={handleNext}>
                {idx < total - 1 ? '下一题' : '完成'}
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
