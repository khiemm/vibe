'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type AwsExamPracticeQuestion,
  type AwsExamQuestionSet,
} from '@/lib/aws-exam';

type AnswerMap = Record<number, string[]>;

type PersistedSession = {
  answers: AnswerMap;
  flaggedIds: number[];
  currentIndex: number;
  timeLeft: number;
  submitted: boolean;
  isPaused: boolean;
};

const choiceLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const timerWarningSeconds = 15 * 60;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

function arraysMatch(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();

  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function selectionLabel(question: AwsExamPracticeQuestion) {
  if (question.type === 'single') {
    return 'Choose one.';
  }

  return `Choose ${question.correctOptionIds.length}.`;
}

function loadSession(key: string): PersistedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function saveSession(key: string, session: PersistedSession) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(session));
  } catch {
    // ignore quota errors
  }
}

function clearSession(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export default function PracticeExamPage({
  questionSet,
}: {
  questionSet: AwsExamQuestionSet;
}) {
  const {
    domains,
    examBlueprint,
    questions,
    sourceBasis,
    sourceNote,
    studyTracks,
    title,
    description,
  } = questionSet;

  // Derive display label from exam code: "DVA-C02" → "AWS DVA Mock Lab"
  const examPrefix = examBlueprint.code.split('-')[0];
  const labLabel = `AWS ${examPrefix} Mock Lab`;
  const sessionKey = `aws-exam-session-${questionSet.id}`;
  const scoredQuestions = questions.filter((q) => q.scored);

  // --- State (hydrated from localStorage on mount) ---
  const [hydrated, setHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flaggedIds, setFlaggedIds] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(examBlueprint.durationMinutes * 60);
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadSession(sessionKey);
    if (saved) {
      setAnswers(saved.answers);
      setFlaggedIds(saved.flaggedIds);
      setCurrentIndex(saved.currentIndex);
      setTimeLeft(saved.timeLeft);
      setSubmitted(saved.submitted);
      setIsPaused(saved.isPaused);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFirstSave = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    saveSession(sessionKey, {
      answers,
      flaggedIds,
      currentIndex,
      timeLeft,
      submitted,
      isPaused,
    });
  }, [
    answers,
    flaggedIds,
    currentIndex,
    timeLeft,
    submitted,
    isPaused,
    hydrated,
    sessionKey,
  ]);

  // --- Timer ---
  useEffect(() => {
    if (submitted || isPaused) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPaused, submitted]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      setSubmitted(true);
    }
  }, [submitted, timeLeft]);

  // --- Derived ---
  const currentQuestion = questions[currentIndex];
  const currentSelections = answers[currentQuestion.id] ?? [];
  const examPaused = isPaused && !submitted;

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? []).length > 0).length,
    [answers, questions],
  );

  const correctCount = useMemo(
    () =>
      scoredQuestions.filter((q) =>
        arraysMatch(answers[q.id] ?? [], q.correctOptionIds),
      ).length,
    [answers, scoredQuestions],
  );

  const readinessScore = Math.round(
    (correctCount / scoredQuestions.length) * 100,
  );

  const domainResults = useMemo(
    () =>
      domains.map((domain) => {
        const dqs = scoredQuestions.filter((q) => q.domain === domain.id);
        const correct = dqs.filter((q) =>
          arraysMatch(answers[q.id] ?? [], q.correctOptionIds),
        ).length;

        return {
          ...domain,
          correct,
          total: dqs.length,
          percentage:
            dqs.length === 0 ? 0 : Math.round((correct / dqs.length) * 100),
        };
      }),
    [answers, domains, scoredQuestions],
  );

  const firstUnansweredIndex = questions.findIndex(
    (q) => (answers[q.id] ?? []).length === 0,
  );

  const currentDomain = domains.find((d) => d.id === currentQuestion.domain);
  const currentQuestionCorrect = arraysMatch(
    answers[currentQuestion.id] ?? [],
    currentQuestion.correctOptionIds,
  );

  // --- Actions ---
  function toggleFlag(questionId: number) {
    if (submitted || isPaused) return;
    setFlaggedIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  }

  function selectOption(question: AwsExamPracticeQuestion, optionId: string) {
    if (submitted || isPaused) return;

    setAnswers((prev) => {
      const existing = prev[question.id] ?? [];

      if (question.type === 'single') {
        return { ...prev, [question.id]: [optionId] };
      }

      const next = existing.includes(optionId)
        ? existing.filter((v) => v !== optionId)
        : [...existing, optionId];

      return { ...prev, [question.id]: next };
    });
  }

  function resetSession() {
    clearSession(sessionKey);
    setAnswers({});
    setFlaggedIds([]);
    setCurrentIndex(0);
    setIsPaused(false);
    setSubmitted(false);
    setTimeLeft(examBlueprint.durationMinutes * 60);
    setDomainFilter(null);
    isFirstSave.current = true;
  }

  // --- Keyboard navigation ---
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (examPaused && !submitted) return;

      switch (e.key) {
        case 'ArrowRight':
          if (!submitted) {
            e.preventDefault();
            setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'f':
        case 'F':
          if (!submitted) {
            e.preventDefault();
            toggleFlag(currentQuestion.id);
          }
          break;
        default: {
          if (!submitted) {
            const num = parseInt(e.key, 10);
            if (num >= 1 && num <= currentQuestion.options.length) {
              e.preventDefault();
              selectOption(
                currentQuestion,
                currentQuestion.options[num - 1].id,
              );
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, examPaused, submitted, questions.length]);

  // --- Palette helpers ---
  function paletteStatus(question: AwsExamPracticeQuestion) {
    const dimmed = domainFilter !== null && question.domain !== domainFilter;

    if (submitted) {
      const isCorrect = arraysMatch(
        answers[question.id] ?? [],
        question.correctOptionIds,
      );
      const base = isCorrect
        ? 'border-emerald-500/45 bg-emerald-500/12 text-[color:var(--site-heading)]'
        : 'border-rose-500/45 bg-rose-500/12 text-[color:var(--site-heading)]';
      return `${base}${dimmed ? ' opacity-20' : ''}`;
    }

    if (currentQuestion.id === question.id) {
      return 'border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]';
    }

    if (flaggedIds.includes(question.id)) {
      return `border-amber-400/50 bg-amber-400/12 text-[color:var(--site-heading)]${dimmed ? ' opacity-20' : ''}`;
    }

    if ((answers[question.id] ?? []).length > 0) {
      return `border-[color:var(--site-border)] bg-[color:var(--site-surface-hover)] text-[color:var(--site-heading)]${dimmed ? ' opacity-20' : ''}`;
    }

    return `border-[color:var(--site-border)] bg-[color:var(--site-surface)] text-[color:var(--site-muted)]${dimmed ? ' opacity-20' : ''}`;
  }

  function optionState(question: AwsExamPracticeQuestion, optionId: string) {
    const isSelected = (answers[question.id] ?? []).includes(optionId);

    if (!submitted) {
      return isSelected
        ? 'border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]'
        : 'border-[color:var(--site-border)] bg-[color:var(--site-surface)] text-[color:var(--site-text)] hover:bg-[color:var(--site-surface-hover)]';
    }

    const isCorrect = question.correctOptionIds.includes(optionId);
    if (isCorrect)
      return 'border-emerald-500/45 bg-emerald-500/12 text-[color:var(--site-heading)]';
    if (isSelected)
      return 'border-rose-500/45 bg-rose-500/12 text-[color:var(--site-heading)]';
    return 'border-[color:var(--site-border)] bg-[color:var(--site-surface)] text-[color:var(--site-text)]';
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,var(--site-surface),var(--site-bg))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative mx-auto flex w-full max-w-7xl flex-col gap-6"
      >
        {/* ── Header card ── */}
        <section className="grid gap-4 rounded-[32px] border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur xl:grid-cols-[1.25fr_0.75fr] xl:p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-[color:var(--site-muted)]">
              <span className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/35 px-3 py-1 text-[color:var(--site-text)]">
                {labLabel}
              </span>
              <span className="rounded-full border border-[color:var(--site-accent)]/40 bg-[color:var(--site-accent-soft)] px-3 py-1 text-[color:var(--site-accent)]">
                {examBlueprint.code}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-[color:var(--site-heading)] sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--site-text)] sm:text-lg">
                {description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/38 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Official shell
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.totalQuestions}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-text)]">
                  questions in the live exam shell
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/38 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Scored core
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.scoredQuestions}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-text)]">
                  used for readiness scoring
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/38 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Calibration
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.unscoredQuestions}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-text)]">
                  extra items for exam realism
                </p>
              </div>
              <div className="rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/38 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Target score
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.targetScore}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-text)]">
                  on the {examBlueprint.scoreRange} scale
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Study tracks
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {studyTracks.map((track) => (
                    <div
                      key={track}
                      className="rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/50 px-4 py-3 text-sm leading-6 text-[color:var(--site-text)]"
                    >
                      {track}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Source basis
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--site-text)]">
                  {sourceNote}
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  {sourceBasis.map((source) => (
                    <a
                      key={source.url}
                      className="block rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/30 px-4 py-3 text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-[color:var(--site-surface-hover)]"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Session sidebar ── */}
          <aside className="flex flex-col gap-4 rounded-[28px] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,var(--site-surface),var(--site-bg))] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Live session
                </div>
                <div className="mt-2 text-2xl font-semibold text-[color:var(--site-heading)]">
                  {submitted
                    ? 'Review mode'
                    : examPaused
                      ? 'Paused'
                      : 'Exam mode'}
                </div>
              </div>
              <div
                className={`rounded-2xl border px-4 py-3 text-right ${
                  examPaused
                    ? 'border-amber-400/45 bg-amber-400/14 text-[color:var(--site-heading)]'
                    : timeLeft <= timerWarningSeconds && !submitted
                      ? 'border-rose-500/45 bg-rose-500/12 text-[color:var(--site-heading)]'
                      : 'border-[color:var(--site-accent)]/40 bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]'
                }`}
              >
                <div className="text-xs uppercase tracking-[0.2em] opacity-70">
                  {examPaused ? 'Paused at' : 'Time left'}
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {!submitted ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  aria-pressed={examPaused}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    examPaused
                      ? 'border-amber-400/50 bg-amber-400/14 text-[color:var(--site-heading)] hover:bg-amber-400/18'
                      : 'border-[color:var(--site-border)] bg-[color:var(--site-surface)] text-[color:var(--site-heading)] hover:border-[color:var(--site-accent)] hover:bg-[color:var(--site-surface-hover)]'
                  }`}
                >
                  {examPaused
                    ? 'Resume this mock exam'
                    : 'Pause this mock exam'}
                </button>
                <div className="rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/50 px-4 py-3 text-sm leading-6 text-[color:var(--site-text)]">
                  Temporarily stops the timer so you can handle interruptions.
                  This is a convenience control and is not part of the real AWS
                  exam.
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/50 p-4">
              <div className="flex items-center justify-between text-sm text-[color:var(--site-muted)]">
                <span>Completion</span>
                <span>
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--site-accent),rgba(14,165,233,0.95))] transition-all"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                Domain weights
              </div>
              <div className="mt-4 space-y-3">
                {domains.map((domain) => {
                  const count = questions.filter(
                    (q) => q.domain === domain.id,
                  ).length;
                  return (
                    <div key={domain.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-[color:var(--site-heading)]">
                            {domain.name}
                          </div>
                          <div className="text-xs leading-5 text-[color:var(--site-muted)]">
                            {domain.focus}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-[color:var(--site-heading)]">
                          {domain.weight}%
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[color:var(--site-muted)]">
                        <span>
                          {domain.scoredQuestions} scored / {count} total
                        </span>
                        <span>official weight {domain.weight}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                Keyboard shortcuts
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-[color:var(--site-muted)]">
                <div className="flex justify-between">
                  <span>← / →</span>
                  <span>Previous / Next question</span>
                </div>
                <div className="flex justify-between">
                  <span>1 – 5</span>
                  <span>Select option by number</span>
                </div>
                <div className="flex justify-between">
                  <span>F</span>
                  <span>Toggle flag on current question</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetSession}
              className="rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-surface)] px-4 py-3 text-left text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-[color:var(--site-surface-hover)]"
            >
              Reset this timed block
            </button>
          </aside>
        </section>

        {submitted ? (
          <section className="grid gap-4 rounded-[30px] border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur sm:p-6 xl:grid-cols-[1.05fr_1.95fr]">
            <div className="rounded-[28px] border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/50 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                Score result
              </div>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-5xl font-semibold tracking-[-0.04em] text-[color:var(--site-heading)]">
                  {readinessScore}%
                </div>
                <div className="pb-2 text-sm text-[color:var(--site-text)]">
                  {correctCount}/{scoredQuestions.length} scored correct
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[color:var(--site-text)]">
                This readiness score is based on the{' '}
                {examBlueprint.scoredQuestions} scored questions. The{' '}
                {examBlueprint.unscoredQuestions} calibration items make the
                page feel closer to the real exam shell but are excluded from
                the score.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {domainResults.map((domain) => (
                <div
                  key={domain.id}
                  className="rounded-[24px] border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/45 p-4"
                >
                  <div className="text-sm font-medium text-[color:var(--site-heading)]">
                    {domain.name}
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                    {domain.percentage}%
                  </div>
                  <div className="mt-2 text-sm text-[color:var(--site-text)]">
                    {domain.correct}/{domain.total} correct
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Question area ── */}
        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Palette */}
          <aside className="rounded-[30px] border border-[color:var(--site-border)] bg-[color:var(--site-surface)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Question palette
                </div>
                <div className="mt-1 text-2xl font-semibold text-[color:var(--site-heading)]">
                  {submitted ? 'Answer review' : 'Jump panel'}
                </div>
              </div>
              <div className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/35 px-3 py-1 text-xs text-[color:var(--site-text)]">
                {questions.length} items
              </div>
            </div>

            {/* Domain filter pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDomainFilter(null)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  domainFilter === null
                    ? 'border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]'
                    : 'border-[color:var(--site-border)] bg-[color:var(--site-surface)] text-[color:var(--site-text)] hover:border-[color:var(--site-accent)]'
                }`}
              >
                All
              </button>
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() =>
                    setDomainFilter(
                      domainFilter === domain.id ? null : domain.id,
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    domainFilter === domain.id
                      ? 'border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]'
                      : 'border-[color:var(--site-border)] bg-[color:var(--site-surface)] text-[color:var(--site-text)] hover:border-[color:var(--site-accent)]'
                  }`}
                >
                  {domain.name.split(' ').slice(-1)[0]}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  disabled={examPaused}
                  className={`rounded-2xl border px-3 py-4 text-sm font-semibold transition ${paletteStatus(question)} ${examPaused ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  {question.id}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3 rounded-3xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/45 p-4 text-sm text-[color:var(--site-text)]">
              <div className="flex items-center justify-between">
                <span>Answered</span>
                <span>{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Flagged</span>
                <span>{flaggedIds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Unanswered</span>
                <span>{questions.length - answeredCount}</span>
              </div>
            </div>

            {!submitted && firstUnansweredIndex >= 0 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(firstUnansweredIndex)}
                disabled={examPaused}
                className="mt-4 w-full rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-surface)] px-4 py-3 text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-[color:var(--site-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Jump to first unanswered
              </button>
            ) : null}

              <div className="mt-6 space-y-2 text-xs uppercase tracking-[0.18em] text-[color:var(--site-muted)]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)]" />
                Current
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-amber-400/50 bg-amber-400/14" />
                Flagged
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-surface-hover)]" />
                Answered
              </div>
              {submitted ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-emerald-400/50 bg-emerald-500/15" />
                    Correct
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-rose-400/50 bg-rose-500/15" />
                    Needs review
                  </div>
                </>
              ) : null}
            </div>
          </aside>

          {/* Question card */}
          <div className="space-y-4">
            <section className="rounded-[30px] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,var(--site-surface),var(--site-bg))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur sm:p-6">
              <div className="flex flex-col gap-4 border-b border-[color:var(--site-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                    <span>
                      Question {currentQuestion.id} of {questions.length}
                    </span>
                    <span className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/40 px-2 py-1 text-[color:var(--site-text)]">
                      {currentDomain?.name}
                    </span>
                    <span className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/40 px-2 py-1 text-[color:var(--site-text)]">
                      {selectionLabel(currentQuestion)}
                    </span>
                    {!currentQuestion.scored && submitted ? (
                      <span className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2 py-1 text-sky-100">
                        Calibration item
                      </span>
                    ) : null}
                  </div>
                  <h2 className="max-w-4xl text-2xl font-semibold tracking-[-0.03em] text-[color:var(--site-heading)] sm:text-3xl">
                    {currentQuestion.prompt}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFlag(currentQuestion.id)}
                  disabled={examPaused || submitted}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    flaggedIds.includes(currentQuestion.id)
                      ? 'border-amber-400/50 bg-amber-400/14 text-[color:var(--site-heading)]'
                      : 'border-[color:var(--site-border)] bg-[color:var(--site-surface)] text-[color:var(--site-heading)] hover:border-[color:var(--site-accent)] hover:bg-[color:var(--site-surface-hover)]'
                  } ${examPaused ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  {flaggedIds.includes(currentQuestion.id)
                    ? 'Flagged for review'
                    : 'Mark for review'}
                </button>
              </div>

              {examPaused ? (
                <div className="mt-6 rounded-[28px] border border-amber-400/40 bg-amber-400/14 p-5 text-sm leading-6 text-[color:var(--site-heading)]">
                  This session is paused. The timer is stopped and exam actions
                  remain locked until you resume.
                </div>
              ) : null}

              {submitted ? (
                <div className="space-y-6 pt-6">
                  <div
                    className={`rounded-[28px] border p-5 ${currentQuestionCorrect ? 'border-emerald-500/35 bg-emerald-500/[0.10]' : 'border-rose-500/35 bg-rose-500/[0.10]'}`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${currentQuestionCorrect ? 'border-emerald-500/35 bg-emerald-500/15 text-[color:var(--site-heading)]' : 'border-rose-500/35 bg-rose-500/15 text-[color:var(--site-heading)]'}`}
                      >
                        {currentQuestionCorrect ? 'Correct' : 'Needs review'}
                      </div>
                      <div className="text-sm text-[color:var(--site-text)]">
                        Correct answer:{' '}
                        <span className="font-medium text-[color:var(--site-heading)]">
                          {currentQuestion.correctOptionIds
                            .map((id) => id.toUpperCase())
                            .join(', ')}
                        </span>
                      </div>
                      <div className="text-sm text-[color:var(--site-text)]">
                        Your answer:{' '}
                        <span className="font-medium text-[color:var(--site-heading)]">
                          {(answers[currentQuestion.id] ?? []).length > 0
                            ? (answers[currentQuestion.id] ?? [])
                                .map((id) => id.toUpperCase())
                                .join(', ')
                            : 'No answer'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4 text-sm leading-7 text-[color:var(--site-text)]">
                      <p>{currentQuestion.explanation}</p>
                      <p className="rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg)]/55 px-4 py-3 text-[color:var(--site-heading)]">
                        {currentQuestion.takeaway}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentSelections.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectOption(currentQuestion, option.id)}
                    disabled={examPaused}
                    className={`flex w-full items-start gap-4 rounded-[24px] border px-4 py-4 text-left transition ${optionState(currentQuestion, option.id)} ${examPaused ? 'cursor-not-allowed opacity-85' : ''}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold ${
                        isSelected && !submitted
                          ? 'border-[color:var(--site-accent)] bg-[color:var(--site-accent)] text-slate-950'
                          : 'border-[color:var(--site-border)] bg-[color:var(--site-bg)]/50 text-[color:var(--site-heading)]'
                      }`}
                    >
                      {choiceLetters[index]}
                    </div>
                    <div className="pt-0.5 text-base leading-7">
                      {option.text}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-[color:var(--site-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.max(prev - 1, 0))
                  }
                  disabled={currentIndex === 0 || examPaused}
                  className="rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-surface)] px-4 py-3 text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-[color:var(--site-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(prev + 1, questions.length - 1),
                    )
                  }
                  disabled={currentIndex === questions.length - 1 || examPaused}
                  className="rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-surface)] px-4 py-3 text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-[color:var(--site-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>

              {submitted ? (
                <button
                  type="button"
                  onClick={resetSession}
                  className="rounded-2xl border border-[color:var(--site-accent)] bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Start a fresh attempt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSubmitted(true)}
                  disabled={examPaused}
                  className="rounded-2xl border border-[color:var(--site-accent)] bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Submit this mock exam
                </button>
              )}
            </div>
            </section>
          </div>
        </section>
      </motion.div>
    </main>
  );
}
