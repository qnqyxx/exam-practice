// 题型定义（使用 const object + 联合类型，兼容 erasableSyntaxOnly）
export const QuestionType = {
  SingleChoice: 'single', // 单选
  MultipleChoice: 'multiple', // 多选
  TrueFalse: 'truefalse', // 判断
  FillBlank: 'fillblank', // 填空/简答
} as const

export type QuestionType =
  (typeof QuestionType)[keyof typeof QuestionType]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: '单选题',
  [QuestionType.MultipleChoice]: '多选题',
  [QuestionType.TrueFalse]: '判断题',
  [QuestionType.FillBlank]: '填空/简答',
}

export const QUESTION_TYPE_ORDER: QuestionType[] = [
  QuestionType.SingleChoice,
  QuestionType.MultipleChoice,
  QuestionType.TrueFalse,
  QuestionType.FillBlank,
]
