import type { Metadata } from 'next'
import PracticeExamPage from '@/components/aws-saa/PracticeExamPage'
import { getDefaultAwsSaaQuestionSet } from '@/lib/aws-saa'

const defaultQuestionSet = getDefaultAwsSaaQuestionSet()

export const metadata: Metadata = {
  title: defaultQuestionSet.title,
  description:
    'A timed AWS Solutions Architect Associate practice page with a 65-question JSON-backed set aligned to the official SAA-C03 blueprint.',
}

export default function AwsSaaPage() {
  return <PracticeExamPage questionSet={defaultQuestionSet} />
}
