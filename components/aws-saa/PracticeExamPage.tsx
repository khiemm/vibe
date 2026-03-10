'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  type AwsSaaPracticeQuestion,
  type AwsSaaQuestionSet,
} from '@/lib/aws-saa'

type AnswerMap = Record<number, string[]>

const choiceLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const timerWarningSeconds = 15 * 60

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

function arraysMatch(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  const leftSorted = [...left].sort()
  const rightSorted = [...right].sort()

  return leftSorted.every((value, index) => value === rightSorted[index])
}

function selectionLabel(question: AwsSaaPracticeQuestion) {
  if (question.type === 'single') {
    return 'Choose one.'
  }

  return `Choose ${question.correctOptionIds.length}.`
}

export default function PracticeExamPage({
  questionSet,
}: {
  questionSet: AwsSaaQuestionSet
}) {
  const {
    domains,
    examBlueprint,
    questions,
    sourceBasis,
    sourceNote,
    studyTracks,
  } = questionSet
  const scoredQuestions = questions.filter((question) => question.scored)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [flaggedIds, setFlaggedIds] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(examBlueprint.durationMinutes * 60)

  const currentQuestion = questions[currentIndex]
  const currentSelections = answers[currentQuestion.id] ?? []

  useEffect(() => {
    if (submitted) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [submitted])

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      setSubmitted(true)
    }
  }, [submitted, timeLeft])

  const answeredCount = useMemo(
    () => questions.filter((question) => (answers[question.id] ?? []).length > 0).length,
    [answers]
  )

  const correctCount = useMemo(
    () =>
      scoredQuestions.filter((question) =>
        arraysMatch(answers[question.id] ?? [], question.correctOptionIds)
      ).length,
    [answers]
  )

  const readinessScore = Math.round((correctCount / scoredQuestions.length) * 100)

  const domainResults = useMemo(
    () =>
      domains.map((domain) => {
        const domainQuestions = scoredQuestions.filter(
          (question) => question.domain === domain.id
        )
        const domainCorrect = domainQuestions.filter((question) =>
          arraysMatch(answers[question.id] ?? [], question.correctOptionIds)
        ).length

        return {
          ...domain,
          correct: domainCorrect,
          total: domainQuestions.length,
          percentage:
            domainQuestions.length === 0
              ? 0
              : Math.round((domainCorrect / domainQuestions.length) * 100),
        }
      }),
    [answers, domains, scoredQuestions]
  )

  const firstUnansweredIndex = questions.findIndex(
    (question) => (answers[question.id] ?? []).length === 0
  )

  function toggleFlag(questionId: number) {
    setFlaggedIds((previous) =>
      previous.includes(questionId)
        ? previous.filter((id) => id !== questionId)
        : [...previous, questionId]
    )
  }

  function selectOption(question: AwsSaaPracticeQuestion, optionId: string) {
    if (submitted) {
      return
    }

    setAnswers((previous) => {
      const existing = previous[question.id] ?? []

      if (question.type === 'single') {
        return {
          ...previous,
          [question.id]: [optionId],
        }
      }

      const nextSelection = existing.includes(optionId)
        ? existing.filter((value) => value !== optionId)
        : [...existing, optionId]

      return {
        ...previous,
        [question.id]: nextSelection,
      }
    })
  }

  function resetSession() {
    setAnswers({})
    setFlaggedIds([])
    setCurrentIndex(0)
    setSubmitted(false)
    setTimeLeft(examBlueprint.durationMinutes * 60)
  }

  function paletteStatus(question: AwsSaaPracticeQuestion) {
    if (submitted) {
      const isCorrect = arraysMatch(
        answers[question.id] ?? [],
        question.correctOptionIds
      )

      return isCorrect
        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
        : 'border-rose-400/50 bg-rose-500/15 text-rose-100'
    }

    if (currentQuestion.id === question.id) {
      return 'border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]'
    }

    if (flaggedIds.includes(question.id)) {
      return 'border-amber-300/50 bg-amber-400/10 text-amber-100'
    }

    if ((answers[question.id] ?? []).length > 0) {
      return 'border-white/15 bg-white/10 text-white'
    }

    return 'border-white/10 bg-black/10 text-[color:var(--site-muted)]'
  }

  function optionState(question: AwsSaaPracticeQuestion, optionId: string) {
    const isSelected = (answers[question.id] ?? []).includes(optionId)

    if (!submitted) {
      return isSelected
        ? 'border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]'
        : 'border-white/10 bg-white/[0.04] text-[color:var(--site-text)] hover:bg-white/[0.08]'
    }

    const isCorrect = question.correctOptionIds.includes(optionId)

    if (isCorrect) {
      return 'border-emerald-400/60 bg-emerald-500/10 text-emerald-50'
    }

    if (isSelected && !isCorrect) {
      return 'border-rose-400/60 bg-rose-500/10 text-rose-50'
    }

    return 'border-white/10 bg-white/[0.03] text-[color:var(--site-muted)]'
  }

  const currentDomain = domains.find(
    (domain) => domain.id === currentQuestion.domain
  )
  const currentQuestionCorrect = arraysMatch(
    answers[currentQuestion.id] ?? [],
    currentQuestion.correctOptionIds
  )

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative mx-auto flex w-full max-w-7xl flex-col gap-6"
      >
        <section className="grid gap-4 rounded-[32px] border border-white/10 bg-black/20 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur xl:grid-cols-[1.25fr_0.75fr] xl:p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-[color:var(--site-muted)]">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                AWS SAA Mock Lab
              </span>
              <span className="rounded-full border border-[color:var(--site-accent)]/40 bg-[color:var(--site-accent-soft)] px-3 py-1 text-[color:var(--site-accent)]">
                {examBlueprint.code}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-[color:var(--site-heading)] sm:text-5xl">
                Trang luyen thi theo flow exam AWS Solutions Architect
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[color:var(--site-text)] sm:text-lg">
                Mo phong cach lam bai kieu exam shell voi timer, question
                palette, flag for review va phan cham sau khi nop. Noi dung ben
                trong la 65 cau hoi goc tu bien soan theo blueprint cong khai cua
                AWS. Set nay gom 50 cau scored theo blueprint va 15 cau
                calibration de mo phong sat cau truc exam that, khong dung dump
                cau hoi that.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Official shell
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.totalQuestions}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-muted)]">
                  questions in the live exam shell
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Scored core
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.scoredQuestions}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-muted)]">
                  used for readiness scoring
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Calibration
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.unscoredQuestions}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-muted)]">
                  extra items for exam realism
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Target score
                </div>
                <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                  {examBlueprint.targetScore}
                </div>
                <p className="mt-2 text-sm text-[color:var(--site-muted)]">
                  on the {examBlueprint.scoreRange} scale
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Study tracks
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {studyTracks.map((track) => (
                    <div
                      key={track}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[color:var(--site-text)]"
                    >
                      {track}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
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
                      className="block rounded-2xl border border-white/10 px-4 py-3 text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-white/[0.04]"
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

          <aside className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Live session
                </div>
                <div className="mt-2 text-2xl font-semibold text-[color:var(--site-heading)]">
                  {submitted ? 'Review mode' : 'Exam mode'}
                </div>
              </div>
              <div
                className={`rounded-2xl border px-4 py-3 text-right ${
                  timeLeft <= timerWarningSeconds && !submitted
                    ? 'border-rose-400/40 bg-rose-500/10 text-rose-50'
                    : 'border-[color:var(--site-accent)]/40 bg-[color:var(--site-accent-soft)] text-[color:var(--site-heading)]'
                }`}
              >
                <div className="text-xs uppercase tracking-[0.2em] opacity-70">
                  Time left
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
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

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                Domain weights
              </div>
              <div className="mt-4 space-y-3">
                {domains.map((domain) => {
                  const questionCount = questions.filter(
                    (question) => question.domain === domain.id
                  ).length

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
                          {domain.scoredQuestions} scored / {questionCount} total
                        </span>
                        <span>official weight {domain.weight}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={resetSession}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-white/[0.08]"
            >
              Reset this timed block
            </button>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-white/10 bg-black/25 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  Question palette
                </div>
                <div className="mt-1 text-2xl font-semibold text-[color:var(--site-heading)]">
                  {submitted ? 'Answer review' : 'Jump panel'}
                </div>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--site-muted)]">
                {questions.length} items
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-3">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`rounded-2xl border px-3 py-4 text-sm font-semibold transition ${paletteStatus(
                    question
                  )}`}
                >
                  {question.id}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[color:var(--site-text)]">
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
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-white/[0.08]"
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
                <span className="h-3 w-3 rounded-full border border-amber-300/50 bg-amber-400/10" />
                Flagged
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-white/20 bg-white/10" />
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

          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                  <span>
                    Question {currentQuestion.id} of {questions.length}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1">
                    {currentDomain?.name}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1">
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
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  flaggedIds.includes(currentQuestion.id)
                    ? 'border-amber-300/50 bg-amber-400/10 text-amber-50'
                    : 'border-white/10 bg-white/[0.04] text-[color:var(--site-heading)] hover:border-[color:var(--site-accent)] hover:bg-white/[0.08]'
                }`}
              >
                {flaggedIds.includes(currentQuestion.id)
                  ? 'Flagged for review'
                  : 'Mark for review'}
              </button>
            </div>

            {submitted ? (
              <div className="space-y-6 pt-6">
                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--site-muted)]">
                      Practice score
                    </div>
                    <div className="mt-2 flex items-end gap-3">
                      <div className="text-5xl font-semibold tracking-[-0.04em] text-[color:var(--site-heading)]">
                        {readinessScore}%
                      </div>
                      <div className="pb-2 text-sm text-[color:var(--site-muted)]">
                        {correctCount}/{scoredQuestions.length} scored correct
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[color:var(--site-text)]">
                      Day la readiness score dua tren 50 cau scored. 15 cau
                      calibration duoc chen vao de page giong shell exam that
                      hon, nhung khong duoc tinh vao readiness score.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {domainResults.map((domain) => (
                      <div
                        key={domain.id}
                        className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="text-sm font-medium text-[color:var(--site-heading)]">
                          {domain.name}
                        </div>
                        <div className="mt-2 text-3xl font-semibold text-[color:var(--site-heading)]">
                          {domain.percentage}%
                        </div>
                        <div className="mt-2 text-sm text-[color:var(--site-muted)]">
                          {domain.correct}/{domain.total} correct
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-[28px] border p-5 ${
                    currentQuestionCorrect
                      ? 'border-emerald-400/30 bg-emerald-500/8'
                      : 'border-rose-400/30 bg-rose-500/8'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                        currentQuestionCorrect
                          ? 'bg-emerald-500/15 text-emerald-100'
                          : 'bg-rose-500/15 text-rose-100'
                      }`}
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
                    <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[color:var(--site-heading)]">
                      {currentQuestion.takeaway}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentSelections.includes(option.id)

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectOption(currentQuestion, option.id)}
                    className={`flex w-full items-start gap-4 rounded-[24px] border px-4 py-4 text-left transition ${optionState(
                      currentQuestion,
                      option.id
                    )}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold ${
                        isSelected && !submitted
                          ? 'border-[color:var(--site-accent)] bg-[color:var(--site-accent)] text-slate-950'
                          : 'border-white/10 bg-black/20 text-[color:var(--site-heading)]'
                      }`}
                    >
                      {choiceLetters[index]}
                    </div>
                    <div className="pt-0.5 text-base leading-7">{option.text}</div>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((previous) => Math.max(previous - 1, 0))}
                  disabled={currentIndex === 0}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((previous) =>
                      Math.min(previous + 1, questions.length - 1)
                    )
                  }
                  disabled={currentIndex === questions.length - 1}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-[color:var(--site-heading)] transition hover:border-[color:var(--site-accent)] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="rounded-2xl border border-[color:var(--site-accent)] bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Submit this mock exam
                </button>
              )}
            </div>
          </section>
        </section>
      </motion.div>
    </main>
  )
}
