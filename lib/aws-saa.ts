import corePracticeSetJson from '@/content/aws/saa/question-sets/saa-c03-core-65-2026-03.json'

export type AwsSaaDomainId =
  | 'secure'
  | 'resilient'
  | 'performant'
  | 'cost'

export type AwsSaaQuestionType = 'single' | 'multi'

export type AwsSaaSourceLink = {
  label: string
  url: string
}

export type AwsSaaDomain = {
  id: AwsSaaDomainId
  name: string
  weight: number
  focus: string
  scoredQuestions: number
}

export type AwsSaaQuestionOption = {
  id: string
  text: string
}

export type AwsSaaPracticeQuestion = {
  id: number
  domain: AwsSaaDomainId
  scored: boolean
  type: AwsSaaQuestionType
  prompt: string
  options: AwsSaaQuestionOption[]
  correctOptionIds: string[]
  explanation: string
  takeaway: string
}

export type AwsSaaQuestionSet = {
  id: string
  title: string
  versionDate: string
  description: string
  sourceNote: string
  sourceBasis: AwsSaaSourceLink[]
  examBlueprint: {
    code: string
    totalQuestions: number
    scoredQuestions: number
    unscoredQuestions: number
    durationMinutes: number
    scoreRange: string
    targetScore: number
    style: string[]
    scoredDomainTargetCounts: Record<AwsSaaDomainId, number>
  }
  domains: AwsSaaDomain[]
  studyTracks: string[]
  questions: AwsSaaPracticeQuestion[]
}

const corePracticeSet = corePracticeSetJson as AwsSaaQuestionSet

export const awsSaaQuestionSets: AwsSaaQuestionSet[] = [corePracticeSet]

export function getDefaultAwsSaaQuestionSet() {
  return awsSaaQuestionSets[0]
}

export function getAwsSaaQuestionSetById(questionSetId: string) {
  return awsSaaQuestionSets.find((questionSet) => questionSet.id === questionSetId)
}
