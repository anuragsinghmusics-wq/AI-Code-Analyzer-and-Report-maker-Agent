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
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Exceptional";
  if (score >= 76) return "Strong Candidate";
  if (score >= 61) return "Moderate";
  if (score >= 41) return "Needs Improvement";
  return "Not Recommended";
}

function getDifficultyStyle(d: string) {
  if (d === "hard")   return { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   text: "#f87171" };
  if (d === "medium") return { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  text: "#fbbf24" };
  return                     { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   text: "#4ade80" };
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
      const res = await fetch("/api/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, submittedAnswers: Object.values(answers) }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Server error");
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message || "Failed to submit interview.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoreColor = result ? getScoreColor(result.interviewScore) : "#3b82f6";
  const correctCount = result?.evaluations.filter((e) => e.isCorrect).length ?? 0;

  // Index of the question currently scrolled into view for dot-nav
  const scrollToQuestion = (idx: number) => {
    const el = document.getElementById(`question-${idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-6">

      {/* ── HEADER CARD ── */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Interactive Technical Interview</h2>
              </div>
              <p className="text-sm text-white/40">
                {result
                  ? "Interview complete — review your results below."
                  : `Answer all ${totalQuestions} questions, then submit for AI-graded evaluation.`}
              </p>
            </div>
            {/* Progress badge */}
            <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] shrink-0">
              <span className="text-3xl font-black tabular-nums" style={{ color: allAnswered ? "#22c55e" : "#3b82f6" }}>
                {answeredCount}/{totalQuestions}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">Answered</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/30 mb-1.5">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: allAnswered
                    ? "linear-gradient(to right,#22c55e,#16a34a)"
                    : "linear-gradient(to right,#3b82f6,#8b5cf6)",
                  boxShadow: allAnswered ? "0 0 8px #22c55e66" : "0 0 8px #3b82f666",
                }}
              />
            </div>
            {/* Question navigation dots */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const evaluation = result?.evaluations.find(e => e.questionId === q.id);
                let dotColor = 'bg-white/15';
                if (result && evaluation) dotColor = evaluation.isCorrect ? 'bg-emerald-500' : 'bg-red-500';
                else if (isAnswered) dotColor = 'bg-blue-500';
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(idx)}
                    title={`Q${(q.index ?? idx + 1)} ${isAnswered ? '(answered)' : '(unanswered)'}`}
                    className={`w-5 h-5 rounded-md text-[9px] font-bold transition-all duration-200 hover:scale-110 ${dotColor} ${isAnswered || (result && evaluation) ? 'text-white' : 'text-white/30'}`}
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
            // NOTE: id added to each question card for scroll targeting
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
                className="rounded-2xl border transition-all duration-300 scroll-mt-20"
                style={{
                  borderColor: evaluation
                    ? evaluation.isCorrect
                      ? "rgba(34,197,94,0.3)"
                      : "rgba(239,68,68,0.3)"
                    : isAnswered
                    ? "rgba(99,102,241,0.3)"
                    : "rgba(255,255,255,0.06)",
                  backgroundColor: evaluation
                    ? evaluation.isCorrect
                      ? "rgba(34,197,94,0.04)"
                      : "rgba(239,68,68,0.04)"
                    : "rgba(255,255,255,0.02)",
                }}
              >
                {/* Question header */}
                <div className="px-5 pt-5 pb-3 flex flex-wrap items-start gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    Q{q.index ?? qIdx + 1}
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border capitalize"
                    style={{ backgroundColor: diffStyle.bg, borderColor: diffStyle.border, color: diffStyle.text }}
                  >
                    {q.difficulty}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40">
                    {q.category}
                  </span>
                  {q.codeRef && (
                    <code className="text-[10px] px-2 py-1 rounded-lg bg-black/50 text-purple-300 font-mono border border-purple-500/20">
                      {q.codeRef}
                    </code>
                  )}
                  {/* Answered check */}
                  {isAnswered && !result && (
                    <span className="ml-auto text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Selected
                    </span>
                  )}
                </div>

                <p className="px-5 pb-4 text-sm font-medium text-white/80 leading-relaxed">{q.text}</p>

                {/* Options grid */}
                {parsedOptions.length > 0 && (
                  <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {parsedOptions.map((opt, i) => {
                      const label     = String.fromCharCode(65 + i);
                      const isSelected = selectedAnswer?.selectedIndex === i;
                      const isCorrectOpt = result && evaluation && opt === evaluation.correctAnswer;
                      const isWrongSel  = result && evaluation && isSelected && !evaluation.isCorrect;

                      let bg = "rgba(255,255,255,0.02)";
                      let border = "rgba(255,255,255,0.08)";
                      let text = "rgba(255,255,255,0.65)";
                      let glow = "none";

                      if (result && evaluation) {
                        if (isCorrectOpt) {
                          bg = "rgba(34,197,94,0.08)"; border = "rgba(34,197,94,0.45)"; text = "#86efac";
                          glow = "0 0 12px rgba(34,197,94,0.15)";
                        } else if (isWrongSel) {
                          bg = "rgba(239,68,68,0.08)"; border = "rgba(239,68,68,0.45)"; text = "#fca5a5";
                        } else {
                          text = "rgba(255,255,255,0.25)";
                        }
                      } else if (isSelected) {
                        bg = "rgba(99,102,241,0.1)"; border = "rgba(99,102,241,0.55)"; text = "#c4b5fd";
                        glow = "0 0 12px rgba(99,102,241,0.15)";
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectOption(q, opt, i, parsedOptions)}
                          disabled={!!result}
                          className="flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 group disabled:cursor-not-allowed"
                          style={{ backgroundColor: bg, borderColor: border, color: text, boxShadow: glow }}
                        >
                          {/* Label circle */}
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black mt-0.5 transition-all duration-200"
                            style={{
                              borderColor: result && isCorrectOpt ? "#22c55e" : result && isWrongSel ? "#ef4444" : isSelected ? "#818cf8" : "rgba(255,255,255,0.15)",
                              backgroundColor: result && isCorrectOpt ? "rgba(34,197,94,0.2)" : result && isWrongSel ? "rgba(239,68,68,0.2)" : isSelected ? "rgba(99,102,241,0.2)" : "transparent",
                              color: result && isCorrectOpt ? "#22c55e" : result && isWrongSel ? "#ef4444" : isSelected ? "#a5b4fc" : "rgba(255,255,255,0.3)",
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
                    className="mx-5 mb-5 p-4 rounded-xl border text-xs leading-relaxed"
                    style={{
                      backgroundColor: evaluation.isCorrect ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                      borderColor: evaluation.isCorrect ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: evaluation.isCorrect ? "#22c55e" : "#ef4444" }}>
                      {evaluation.isCorrect ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      {evaluation.isCorrect ? "Correct" : "Incorrect"}
                    </div>
                    <p className="text-white/50">{evaluation.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── STICKY SUBMIT BAR ── */}
        {!result && (
          <div className="sticky bottom-0 px-6 pb-5 pt-4 border-t border-white/[0.06] bg-black/70 backdrop-blur-xl flex items-center justify-between gap-4">
            <div className="text-xs text-white/30">
              {allAnswered
                ? <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    All {totalQuestions} answered
                  </span>
                : <span>{totalQuestions - answeredCount} of {totalQuestions} remaining</span>
              }
            </div>
            <div className="flex items-center gap-3">
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="relative px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden group"
                style={{
                  background: allAnswered ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : "rgba(255,255,255,0.07)",
                  color: "#fff",
                  boxShadow: allAnswered ? "0 0 24px rgba(99,102,241,0.35)" : "none",
                }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
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
          <div className="mx-6 mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <div className="p-6 border-b border-white/[0.06] flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: scoreColor }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Interview Complete
              </div>
              {/* Ring */}
              <div
                className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center"
                style={{
                  borderColor: scoreColor,
                  boxShadow: `0 0 40px ${scoreColor}44`,
                  background: `radial-gradient(circle,${scoreColor}12,transparent 70%)`,
                }}
              >
                <span className="text-4xl font-black tabular-nums" style={{ color: scoreColor }}>{result.interviewScore}</span>
                <span className="text-[10px] uppercase tracking-widest text-white/30">/ 100</span>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: scoreColor }}>{getScoreLabel(result.interviewScore)}</div>
                <div className="text-xs text-white/30 mt-0.5">{correctCount} / {result.evaluations.length} correct</div>
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
              <div className="p-4 text-center">
                <div className="text-2xl font-black text-emerald-400">{correctCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400/60 mt-0.5">Correct</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-black text-red-400">{result.evaluations.length - correctCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-red-400/60 mt-0.5">Incorrect</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-black" style={{ color: scoreColor }}>{result.interviewScore}%</div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">Score</div>
              </div>
            </div>

            {/* Feedback */}
            {result.feedbackSummary && (
              <div className="p-5 border-t border-white/[0.06]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  AI Interviewer Feedback
                </div>
                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{result.feedbackSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
