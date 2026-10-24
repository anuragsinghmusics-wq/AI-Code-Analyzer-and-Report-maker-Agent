"use client";

import React, { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  index: number;
  text: string;
  options: string | null;
  category: string;
  difficulty: string;
  codeRef: string | null;
}

interface QuestionEvaluation {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface InterviewResult {
  attemptId: string;
  interviewScore: number;
  feedbackSummary: string;
  evaluations: QuestionEvaluation[];
}

interface SelectedAnswer {
  questionId: string;
  questionText: string;
  selectedOption: string;
  selectedIndex: number;
  options: string[];
}

interface Props {
  questions: Question[];
  reportId: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getScoreColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#ea580c";
  return "#dc2626";
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Exceptional";
  if (score >= 76) return "Strong Candidate";
  if (score >= 61) return "Moderate";
  if (score >= 41) return "Needs Improvement";
  return "Not Recommended";
}

function getDifficultyStyle(d: string) {
  if (d === "hard")   return { bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.25)",  text: "#b91c1c" };
  if (d === "medium") return { bg: "rgba(217,119,6,0.1)",  border: "rgba(217,119,6,0.25)",  text: "#b45309" };
  return                     { bg: "rgba(5,150,105,0.1)",  border: "rgba(5,150,105,0.25)",  text: "#047857" };
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InteractiveInterview({ questions, reportId }: Props) {
  const [answers, setAnswers]       = useState<Record<string, SelectedAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult]         = useState<InterviewResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const totalQuestions = questions.length;
  const answeredCount  = Object.keys(answers).length;
  const allAnswered    = answeredCount === totalQuestions;
  const progress       = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleSelectOption = (
    question: Question,
    optionText: string,
    optionIndex: number,
    parsedOptions: string[]
  ) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        questionText: question.text,
        selectedOption: optionText,
        selectedIndex: optionIndex,
        options: parsedOptions,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const answerList = Object.values(answers);
      const payload = {
        reportId,
        submittedAnswers: answerList,
        answers: answerList,
      };

      const res = await fetch("/api/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data: InterviewResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("Failed to submit interview answers:", err);
      setError(err.message || "Failed to submit answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToQuestion = (index: number) => {
    const el = document.getElementById(`question-${index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const correctCount = result
    ? result.evaluations.filter((e) => e.isCorrect).length
    : 0;
  const scoreColor = result ? getScoreColor(result.interviewScore) : "#059669";

  return (
    <div className="space-y-6">

      {/* ── HEADER CARD ── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Interactive Technical Interview</h2>
              </div>
              <p className="text-sm text-slate-500">
                {result
                  ? "Interview complete — review your results below."
                  : `Answer all ${totalQuestions} questions, then submit for AI-graded evaluation.`}
              </p>
            </div>
            {/* Progress badge */}
            <div className="flex flex-col items-center px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
              <span className="text-3xl font-black tabular-nums text-slate-900">
                {answeredCount}/{totalQuestions}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5 font-bold">Answered</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span>Progress</span>
              <span className="font-bold text-emerald-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-emerald-600"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Question navigation dots */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const evaluation = result?.evaluations.find(e => e.questionId === q.id);
                let dotClass = 'bg-slate-100 text-slate-400 border border-slate-200';
                if (result && evaluation) dotClass = evaluation.isCorrect ? 'bg-emerald-600 text-white font-bold' : 'bg-red-600 text-white font-bold';
                else if (isAnswered) dotClass = 'bg-emerald-600 text-white font-bold';
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(idx)}
                    title={`Q${(q.index ?? idx + 1)} ${isAnswered ? '(answered)' : '(unanswered)'}`}
                    className={`w-6 h-6 rounded-md text-[10px] font-mono transition-all duration-200 hover:scale-105 flex items-center justify-center ${dotClass}`}
                  >
                    {q.index ?? idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── QUESTIONS ── */}
        <div className="p-6 space-y-5">
          {questions.map((q, qIdx) => {
            const parsedOptions: string[] =
              q.options
                ? typeof q.options === "string"
                  ? JSON.parse(q.options)
                  : (q.options as unknown as string[])
                : [];
            const selectedAnswer = answers[q.id];
            const evaluation     = result?.evaluations.find((e) => e.questionId === q.id);
            const diffStyle      = getDifficultyStyle(q.difficulty);
            const isAnswered     = !!selectedAnswer;

            return (
              <div
                key={q.id}
                id={`question-${qIdx}`}
                className="rounded-2xl border transition-all duration-300 scroll-mt-20 p-5 bg-white"
                style={{
                  borderColor: evaluation
                    ? evaluation.isCorrect
                      ? "rgba(5,150,105,0.4)"
                      : "rgba(220,38,38,0.4)"
                    : isAnswered
                    ? "rgba(5,150,105,0.4)"
                    : "#e2e8f0",
                  backgroundColor: evaluation
                    ? evaluation.isCorrect
                      ? "rgba(5,150,105,0.03)"
                      : "rgba(220,38,38,0.03)"
                    : isAnswered
                    ? "rgba(5,150,105,0.02)"
                    : "#ffffff",
                }}
              >
                {/* Question header */}
                <div className="pb-3 flex flex-wrap items-start gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono">
                    Q{q.index ?? qIdx + 1}
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border capitalize"
                    style={{ backgroundColor: diffStyle.bg, borderColor: diffStyle.border, color: diffStyle.text }}
                  >
                    {q.difficulty}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
                    {q.category}
                  </span>
                  {q.codeRef && (
                    <code className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 text-emerald-700 font-mono border border-emerald-200">
                      {q.codeRef}
                    </code>
                  )}
                  {/* Answered check */}
                  {isAnswered && !result && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-700 flex items-center gap-1 font-mono">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Selected
                    </span>
                  )}
                </div>

                <p className="pb-4 text-sm font-semibold text-slate-900 leading-relaxed">{q.text}</p>

                {/* Options grid */}
                {parsedOptions.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {parsedOptions.map((opt, i) => {
                      const label     = String.fromCharCode(65 + i);
                      const isSelected = selectedAnswer?.selectedIndex === i;
                      const isCorrectOpt = result && evaluation && opt === evaluation.correctAnswer;
                      const isWrongSel  = result && evaluation && isSelected && !evaluation.isCorrect;

                      let bg = "#f8fafc";
                      let border = "#e2e8f0";
                      let text = "#334155";

                      if (result && evaluation) {
                        if (isCorrectOpt) {
                          bg = "rgba(5,150,105,0.08)"; border = "rgba(5,150,105,0.5)"; text = "#047857";
                        } else if (isWrongSel) {
                          bg = "rgba(220,38,38,0.08)"; border = "rgba(220,38,38,0.5)"; text = "#b91c1c";
                        } else {
                          text = "#94a3b8";
                        }
                      } else if (isSelected) {
                        bg = "rgba(5,150,105,0.08)"; border = "rgba(5,150,105,0.5)"; text = "#047857";
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectOption(q, opt, i, parsedOptions)}
                          disabled={!!result}
                          className="flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 group disabled:cursor-not-allowed shadow-sm"
                          style={{ backgroundColor: bg, borderColor: border, color: text }}
                        >
                          {/* Label circle */}
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black mt-0.5 transition-all duration-150"
                            style={{
                              borderColor: result && isCorrectOpt ? "#059669" : result && isWrongSel ? "#dc2626" : isSelected ? "#059669" : "#cbd5e1",
                              backgroundColor: result && isCorrectOpt ? "rgba(5,150,105,0.2)" : result && isWrongSel ? "rgba(220,38,38,0.2)" : isSelected ? "rgba(5,150,105,0.2)" : "transparent",
                              color: result && isCorrectOpt ? "#059669" : result && isWrongSel ? "#dc2626" : isSelected ? "#059669" : "#64748b",
                            }}
                          >
                            {result && isCorrectOpt ? "✓" : result && isWrongSel ? "✗" : label}
                          </span>
                          <span className="text-sm leading-relaxed">
                            <span className="font-bold mr-1.5 opacity-60">{label}.</span>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Explanation after submit */}
                {evaluation && (
                  <div
                    className="mt-4 p-4 rounded-xl border text-xs leading-relaxed"
                    style={{
                      backgroundColor: evaluation.isCorrect ? "rgba(5,150,105,0.06)" : "rgba(220,38,38,0.06)",
                      borderColor: evaluation.isCorrect ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.25)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: evaluation.isCorrect ? "#059669" : "#dc2626" }}>
                      {evaluation.isCorrect ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      {evaluation.isCorrect ? "Correct" : "Incorrect"}
                    </div>
                    <p className="text-slate-700">{evaluation.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── STICKY SUBMIT BAR ── */}
        {!result && (
          <div className="sticky bottom-0 px-6 pb-5 pt-4 border-t border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {allAnswered
                ? <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    All {totalQuestions} answered
                  </span>
                : <span>{totalQuestions - answeredCount} of {totalQuestions} remaining</span>
              }
            </div>
            <div className="flex items-center gap-3">
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="relative px-7 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                    Evaluating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Submit & Get Score
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── RESULT PANEL ── */}
        {result && (
          <div className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: scoreColor }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Interview Complete
              </div>
              {/* Ring */}
              <div
                className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center bg-slate-50"
                style={{ borderColor: scoreColor }}
              >
                <span className="text-4xl font-black tabular-nums" style={{ color: scoreColor }}>{result.interviewScore}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">/ 100</span>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: scoreColor }}>{getScoreLabel(result.interviewScore)}</div>
                <div className="text-xs text-slate-400 mt-0.5">{correctCount} / {result.evaluations.length} correct</div>
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50">
              <div className="p-4 text-center">
                <div className="text-2xl font-black text-emerald-700">{correctCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold mt-0.5">Correct</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-black text-red-600">{result.evaluations.length - correctCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-red-700 font-bold mt-0.5">Incorrect</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-black" style={{ color: scoreColor }}>{result.interviewScore}%</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Score</div>
              </div>
            </div>

            {/* Feedback */}
            {result.feedbackSummary && (
              <div className="p-5 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5 font-bold">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  AI Interviewer Feedback
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.feedbackSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
