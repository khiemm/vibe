import type { Metadata } from 'next';
import PracticeExamPage from '@/components/aws-exam/PracticeExamPage';
import { getDefaultAwsDvaQuestionSet } from '@/lib/aws-dva';
import type { AwsExamQuestionSet } from '@/lib/aws-exam';

const defaultQuestionSet =
  getDefaultAwsDvaQuestionSet() as unknown as AwsExamQuestionSet;

export const metadata: Metadata = {
  title: defaultQuestionSet.title,
  description:
    'A timed AWS Developer Associate practice page with a 65-question JSON-backed set aligned to the official DVA-C02 blueprint.',
};

export default function AwsDvaPage() {
  return <PracticeExamPage questionSet={defaultQuestionSet} />;
}
