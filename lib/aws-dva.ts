import corePracticeSetJson from '@/content/aws/dva/question-sets/dva-c02-core-65-2026-03.json';

export type AwsDvaDomainId = 'develop' | 'security' | 'deploy' | 'optimize';

export type AwsDvaQuestionType = 'single' | 'multi';

export type AwsDvaSourceLink = {
  label: string;
  url: string;
};

export type AwsDvaDomain = {
  id: AwsDvaDomainId;
  name: string;
  weight: number;
  focus: string;
  scoredQuestions: number;
};

export type AwsDvaQuestionOption = {
  id: string;
  text: string;
};

export type AwsDvaPracticeQuestion = {
  id: number;
  domain: AwsDvaDomainId;
  scored: boolean;
  type: AwsDvaQuestionType;
  prompt: string;
  options: AwsDvaQuestionOption[];
  correctOptionIds: string[];
  explanation: string;
  takeaway: string;
};

export type AwsDvaQuestionSet = {
  id: string;
  title: string;
  versionDate: string;
  description: string;
  sourceNote: string;
  sourceBasis: AwsDvaSourceLink[];
  examBlueprint: {
    code: string;
    totalQuestions: number;
    scoredQuestions: number;
    unscoredQuestions: number;
    durationMinutes: number;
    scoreRange: string;
    targetScore: number;
    style: string[];
    scoredDomainTargetCounts: Record<AwsDvaDomainId, number>;
  };
  domains: AwsDvaDomain[];
  studyTracks: string[];
  questions: AwsDvaPracticeQuestion[];
};

const corePracticeSet = corePracticeSetJson as AwsDvaQuestionSet;

export const awsDvaQuestionSets: AwsDvaQuestionSet[] = [corePracticeSet];

export function getDefaultAwsDvaQuestionSet() {
  return awsDvaQuestionSets[0];
}

export function getAwsDvaQuestionSetById(questionSetId: string) {
  return awsDvaQuestionSets.find(
    (questionSet) => questionSet.id === questionSetId,
  );
}
