// Shared types for AWS certification practice exam components.
// Domain IDs are typed as string so a single component works across
// SAA, DVA, and any future certification without coupling to exam-specific unions.

export type AwsExamDomain = {
  id: string;
  name: string;
  weight: number;
  focus: string;
  scoredQuestions: number;
};

export type AwsExamSourceLink = {
  label: string;
  url: string;
};

export type AwsExamQuestionOption = {
  id: string;
  text: string;
};

export type AwsExamPracticeQuestion = {
  id: number;
  domain: string;
  scored: boolean;
  type: 'single' | 'multi';
  prompt: string;
  options: AwsExamQuestionOption[];
  correctOptionIds: string[];
  explanation: string;
  takeaway: string;
};

export type AwsExamQuestionSet = {
  id: string;
  title: string;
  versionDate: string;
  description: string;
  sourceNote: string;
  sourceBasis: AwsExamSourceLink[];
  examBlueprint: {
    code: string;
    totalQuestions: number;
    scoredQuestions: number;
    unscoredQuestions: number;
    durationMinutes: number;
    scoreRange: string;
    targetScore: number;
    style: string[];
    scoredDomainTargetCounts: Record<string, number>;
  };
  domains: AwsExamDomain[];
  studyTracks: string[];
  questions: AwsExamPracticeQuestion[];
};
