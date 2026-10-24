"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STEPS_FILE = [
  { id: 'ingest',       label: 'Ingesting Files',              detail: 'Loading your file into the analysis engine...', color: 'from-emerald-600 to-emerald-400' },
  { id: 'parse',        label: 'Parsing AST',                  detail: 'Building abstract syntax tree...',              color: 'from-emerald-500 to-teal-400'    },
  { id: 'file',         label: 'File Analysis',                detail: 'Analyzing responsibilities and purpose...',      color: 'from-teal-500 to-emerald-400'    },
  { id: 'architecture', label: 'Architecture Analysis',        detail: 'Detecting design patterns...',                  color: 'from-emerald-600 to-green-500'   },
  { id: 'dataflow',     label: 'Data Flow Analysis',           detail: 'Tracing state mutations...',                    color: 'from-green-600 to-emerald-400'   },
  { id: 'logic',        label: 'Logic Review',                 detail: 'Checking algorithm complexity...',              color: 'from-emerald-500 to-teal-400'    },
  { id: 'quality',      label: 'Quality Review',               detail: 'Scoring across quality dimensions...',          color: 'from-emerald-600 to-teal-400'    },
  { id: 'bug',          label: 'Bug Hunting',                  detail: 'Finding vulnerabilities and anti-patterns...',  color: 'from-teal-600 to-emerald-500'    },
  { id: 'performance',  label: 'Performance Analysis',         detail: 'Identifying bottlenecks...',                    color: 'from-emerald-500 to-green-400'   },
  { id: 'design',       label: 'Design Analysis',              detail: 'Evaluating SOLID principles...',                color: 'from-green-500 to-emerald-400'   },
  { id: 'question-gen', label: 'Generating Interview Q+A',     detail: 'Creating contextual questions...',              color: 'from-emerald-600 to-teal-400'    },
  { id: 'report',       label: 'Compiling Report Card',        detail: 'Scoring and formatting results...',             color: 'from-teal-500 to-emerald-400'    },
];

const STEPS_ZIP = [
  { id: 'ingest',       label: 'Extracting Archive',           detail: 'Unzipping and scanning file tree...',           color: 'from-emerald-600 to-emerald-400' },
  { id: 'parse',        label: 'Mapping Project Structure',    detail: 'Resolving modules and entry points...',         color: 'from-emerald-500 to-teal-400'    },
  { id: 'file',         label: 'File-by-File Analysis',        detail: 'Analyzing responsibilities per file...',        color: 'from-teal-500 to-emerald-400'    },
  { id: 'architecture', label: 'Architecture Analysis',        detail: 'Detecting architectural patterns...',           color: 'from-emerald-600 to-green-500'   },
  { id: 'dataflow',     label: 'Data Flow Analysis',           detail: 'Tracing state mutations across files...',       color: 'from-green-600 to-emerald-400'   },
  { id: 'logic',        label: 'Logic Review',                 detail: 'Checking algorithm complexity...',              color: 'from-emerald-500 to-teal-400'    },
  { id: 'quality',      label: 'Quality Review',               detail: 'Scoring across quality dimensions...',          color: 'from-emerald-600 to-teal-400'    },
  { id: 'bug',          label: 'Bug Hunting',                  detail: 'Finding vulnerabilities and anti-patterns...',  color: 'from-teal-600 to-emerald-500'    },
  { id: 'performance',  label: 'Performance Analysis',         detail: 'Identifying bottlenecks...',                    color: 'from-emerald-500 to-green-400'   },
  { id: 'design',       label: 'Design Analysis',              detail: 'Evaluating SOLID principles...',                color: 'from-green-500 to-emerald-400'   },
  { id: 'question-gen', label: 'Generating Interview Q+A',     detail: 'Creating contextual questions...',              color: 'from-emerald-600 to-teal-400'    },
  { id: 'report',       label: 'Compiling Report Card',        detail: 'Scoring and formatting results...',             color: 'from-teal-500 to-emerald-400'    },
];

const STEPS_REPO = [
  { id: 'clone',        label: 'Cloning Repository',           detail: 'Fetching source code from remote...',           color: 'from-emerald-600 to-emerald-400' },
  { id: 'ingest',       label: 'Indexing Files',               detail: 'Walking file tree, filtering relevant code...',  color: 'from-emerald-500 to-teal-400'    },
  { id: 'parse',        label: 'Parsing Project Structure',    detail: 'Building module dependency graph...',            color: 'from-teal-500 to-emerald-400'    },
  { id: 'file',         label: 'File-by-File Analysis',        detail: 'Analyzing responsibilities per file...',         color: 'from-emerald-600 to-green-500'   },
  { id: 'architecture', label: 'Architecture Analysis',        detail: 'Detecting architectural patterns...',            color: 'from-green-600 to-emerald-400'   },
  { id: 'dataflow',     label: 'Data Flow Analysis',           detail: 'Tracing state mutations across modules...',      color: 'from-emerald-500 to-teal-400'    },
  { id: 'logic',        label: 'Logic Review',                 detail: 'Checking algorithm complexity...',               color: 'from-emerald-600 to-teal-400'    },
  { id: 'quality',      label: 'Quality Review',               detail: 'Scoring across quality dimensions...',           color: 'from-teal-600 to-emerald-500'    },
  { id: 'bug',          label: 'Bug Hunting',                  detail: 'Finding vulnerabilities and anti-patterns...',   color: 'from-emerald-500 to-green-400'   },
  { id: 'performance',  label: 'Performance Analysis',         detail: 'Identifying bottlenecks...',                     color: 'from-green-500 to-emerald-400'   },
  { id: 'design',       label: 'Design Analysis',              detail: 'Evaluating SOLID principles...',                 color: 'from-emerald-600 to-teal-400'    },
  { id: 'question-gen', label: 'Generating Interview Q+A',     detail: 'Creating contextual questions...',               color: 'from-teal-500 to-emerald-400'    },
  { id: 'report',       label: 'Compiling Report Card',        detail: 'Scoring and formatting results...',              color: 'from-emerald-500 to-teal-400'    },
];

function getSteps(inputType?: string | null) {
  const t = (inputType ?? '').toUpperCase();
  if (t === 'REPO') return STEPS_REPO;
  if (t === 'ZIP')  return STEPS_ZIP;
  return STEPS_FILE;
}

function getInputLabel(inputType?: string | null) {
  const t = (inputType ?? '').toUpperCase();
  if (t === 'REPO') return 'Repository';
  if (t === 'ZIP')  return 'ZIP Archive';
  return 'File';
}

const INTERVIEW_QUESTIONS = [
  {
    id: 'q1', tag: 'Design Decision',
    question: 'What was the most challenging technical decision or trade-off you made in this project?',
    placeholder: "e.g. I chose X over Y because the team needed Z, but it cost us performance in...",
    color: 'from-emerald-600 to-emerald-400', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50/40',
    tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'q2', tag: 'Self Awareness',
    question: 'If you had 1 more week, what would you refactor or improve first and why?',
    placeholder: "e.g. The auth module has tight coupling I'd extract into a separate service...",
    color: 'from-emerald-600 to-green-500', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50/40',
    tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'q3', tag: 'Pride + Craft',
    question: 'Which part of this codebase are you most proud of, and what makes it stand out?',
    placeholder: "e.g. The event-driven pipeline in src/pipeline/ handles retries and state cleanly...",
    color: 'from-emerald-600 to-teal-500', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50/40',
    tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
];

function InterviewPanel({
  jobId,
  jobDone,
  onAllAnswered,
  onViewReport,
  onUserActiveChange,
}: {
  jobId: string;
  jobDone: boolean;
  onAllAnswered: () => void;
  onViewReport?: () => void;
  onUserActiveChange?: (isTyping: boolean) => void;
}) {
  const [questions, setQuestions] = useState<any[]>(INTERVIEW_QUESTIONS);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [animatingNext, setAnimatingNext] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [pitchResult, setPitchResult] = useState<{
    pitchScore: number; pitchGrade: string; feedback: string;
    questionEvals: { tag: string; score: number; comment: string }[];
    codeScore: number; codeGrade: string;
    compositeScore: number; compositeGrade: string;
  } | null>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notify parent of active engagement (recording or typed characters)
  const hasUserTyped = answers.some(a => a.trim().length > 0);
  useEffect(() => {
    onUserActiveChange?.(isListening || hasUserTyped);
  }, [isListening, hasUserTyped, onUserActiveChange]);

  // Fetch parallel dynamic questions tailored to this codebase
  useEffect(() => {
    let isMounted = true;
    async function loadDynamicQuestions() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/pitch`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.questions) && data.questions.length > 0) {
            const styles = [
              { color: 'from-emerald-600 to-emerald-400', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50/40', tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { color: 'from-emerald-600 to-green-500', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50/40', tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { color: 'from-emerald-600 to-teal-500', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50/40', tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            ];
            const decorated = data.questions.map((item: any, idx: number) => ({
              ...item,
              ...(styles[idx % styles.length]),
            }));
            setQuestions(decorated);
            setAnswers(new Array(decorated.length).fill(''));
          }
        }
      } catch (err) {
        console.warn('Using default questions fallback:', err);
      } finally {
        if (isMounted) setLoadingQuestions(false);
      }
    }
    loadDynamicQuestions();
    return () => { isMounted = false; };
  }, [jobId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) setSpeechSupported(false);
    }
    return () => { try { recognitionRef.current?.stop(); } catch (_) {} };
  }, []);

  useEffect(() => { if (textareaRef.current && !submitted && !loadingQuestions) textareaRef.current.focus(); }, [currentQ, submitted, loadingQuestions]);

  useEffect(() => {
    if (recognitionRef.current && isListening) {
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsListening(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, submitted]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (_) {}
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    let baseText = answers[currentQ] || '';
    if (baseText && !baseText.endsWith(' ')) baseText += ' ';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        else interimTranscript += event.results[i][0].transcript;
      }
      const spoken = (finalTranscript + interimTranscript).trim();
      if (spoken) {
        setAnswers(prev => {
          const a = [...prev];
          a[currentQ] = baseText ? `${baseText}${spoken}` : spoken;
          return a;
        });
      }
    };
    recognition.onerror = (event: any) => { if (event.error !== 'no-speech') setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (err) { setIsListening(false); }
  };

  const advance = () => {
    if (animatingNext) return;
    if (isListening) { try { recognitionRef.current?.stop(); } catch (_) {} setIsListening(false); }
    setAnimatingNext(true);
    setTimeout(() => {
      if (currentQ < questions.length - 1) { setCurrentQ(q => q + 1); }
      else { handleSubmit(); }
      setAnimatingNext(false);
    }, 280);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setIsEvaluating(true);
    onAllAnswered();

    const payload = questions.map((q, i) => ({
      question: q.question,
      tag: q.tag,
      answer: answers[i] || '',
    }));

    try {
      const res = await fetch(`/api/jobs/${jobId}/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setPitchResult(data);
      }
    } catch (err) {
      console.error('Pitch evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // ── Parallel Loading State ──────────────────────────────────────────────────
  if (loadingQuestions) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center px-6 py-12 gap-4">
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#059669"/>
          </svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/70 border border-emerald-300 text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">
            Parallel AI Generation
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Formulating Code Defense Questions...</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            AI is analyzing your code in real-time to generate custom architectural and trade-off questions.
          </p>
        </div>
        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '65%' }} />
        </div>
      </div>
    );
  }

  const q = questions[currentQ] || questions[0];
  const currentAnswer = answers[currentQ] || '';
  const hasEnoughText = currentAnswer.trim().length >= 10;

  // ── Submitted / result state ────────────────────────────────────────────────
  if (submitted) {
    if (isEvaluating) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-center px-6 py-10 gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
            <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#059669"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold mb-1 text-slate-900">Evaluating Your Defense...</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">AI is grading your answers against the codebase. This takes ~10 seconds.</p>
          </div>
          {!jobDone && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-500">Code analysis still running...</span>
            </div>
          )}
        </div>
      );
    }

    if (pitchResult) {
      const gradeColor = (g: string) => {
        const f = g?.charAt(0) || 'F';
        if (f === 'A') return '#059669';
        if (f === 'B') return '#10b981';
        if (f === 'C') return '#d97706';
        if (f === 'D') return '#ea580c';
        return '#dc2626';
      };
      return (
        <div className="flex flex-col h-full px-5 py-5 gap-4 overflow-y-auto">
          <div className="text-center">
            <p className="text-xs font-mono text-slate-400 mb-1 uppercase tracking-widest">Defense Complete</p>
            <h3 className="text-base font-bold text-slate-900">Live Grade Breakdown</h3>
          </div>

          {/* Three-grade row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Code Audit', score: pitchResult.codeScore, grade: pitchResult.codeGrade, sub: '65% weight' },
              { label: 'Defense', score: pitchResult.pitchScore, grade: pitchResult.pitchGrade, sub: '35% weight' },
              { label: 'Composite', score: pitchResult.compositeScore, grade: pitchResult.compositeGrade, sub: 'Final Grade' },
            ].map(({ label, score, grade, sub }) => (
              <div key={label} className="rounded-xl p-3 text-center border border-slate-200 bg-white shadow-sm">
                <p className="text-[10px] font-mono text-slate-400 mb-1">{label}</p>
                <p className="text-xl font-black" style={{ color: gradeColor(grade) }}>{grade}</p>
                <p className="text-[11px] font-bold text-slate-700 mt-0.5">{score != null ? score.toFixed(1) : '—'}<span className="text-slate-400">/10</span></p>
                <p className="text-[9px] text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Per-question scores */}
          <div className="space-y-2">
            {pitchResult.questionEvals.map((ev) => (
              <div key={ev.tag} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 flex items-start gap-3">
                <div className="w-8 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-black" style={{ backgroundColor: `${gradeColor('B')}15`, color: gradeColor('B') }}>
                  {ev.score.toFixed(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{ev.tag}</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{ev.comment}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Holistic feedback */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Evaluator Feedback</p>
            <p className="text-[12px] text-slate-700 leading-relaxed">{pitchResult.feedback}</p>
          </div>

          {jobDone ? (
            <button
              type="button"
              onClick={() => onViewReport?.()}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-1"
            >
              <span>View Full Final Report Card</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-500">Report card compiling...</span>
            </div>
          )}
        </div>
      );
    }

    // Fallback — evaluation completed
    return (
      <div className="flex flex-col h-full items-center justify-center text-center px-6 py-10 gap-5">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2 text-slate-900">Answers Submitted!</h3>
          <p className="text-sm leading-relaxed max-w-xs mx-auto text-slate-600">
            {jobDone ? 'Analysis is complete. You can view your report card now.' : 'Your answers are saved. The AI analysis is still running in the background.'}
          </p>
          {jobDone && (
            <button
              type="button"
              onClick={() => onViewReport?.()}
              className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-2"
            >
              <span>View Full Report Card Now</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Active question state ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white">
      {jobDone && (
        <div className="px-6 py-2 bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Code analysis is complete!
          </span>
          <button
            type="button"
            onClick={() => onViewReport?.()}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
          >
            Skip to Report Card →
          </button>
        </div>
      )}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900">Developer Pitch</p>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">AI Generated</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">Explain your code like in an interview</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full text-slate-600 bg-slate-100 border border-slate-200">
            {currentQ + 1} / {questions.length}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden bg-slate-100">
          <div className={`h-full bg-gradient-to-r ${q.color || 'from-emerald-600 to-emerald-400'} rounded-full transition-all duration-500 ease-out`} style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
      </div>
      <div className={`flex-1 flex flex-col px-6 py-5 transition-opacity duration-280 ${animatingNext ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${q.tagColor || 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>{q.tag}</span>
          {isListening && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-mono font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              Recording Voice...
            </span>
          )}
        </div>
        <p className="text-[15px] font-semibold leading-relaxed mb-4 text-slate-900">{q.question}</p>
        <div className={`relative flex-1 rounded-2xl border ${q.borderColor || 'border-emerald-200'} ${q.bgColor || 'bg-emerald-50/40'} overflow-hidden flex flex-col`}>
          <textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={e => { const a = [...answers]; a[currentQ] = e.target.value; setAnswers(a); }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && hasEnoughText) { e.preventDefault(); advance(); } }}
            placeholder={isListening ? "Listening... speak now. Your words will appear here automatically." : (q.placeholder || "Describe your approach and architectural reasoning...")}
            className="w-full flex-1 min-h-[140px] bg-transparent text-sm resize-none p-4 pb-14 outline-none leading-relaxed text-slate-900 placeholder:text-slate-400 font-medium"
            style={{ caretColor: '#059669' }}
          />

          {/* Textarea Bottom Action Bar */}
          <div className="absolute bottom-2.5 right-3 left-3 flex items-center justify-between pointer-events-none">
            <div>
              {currentAnswer.length > 0 && (
                <span className="text-[10px] font-mono text-slate-500 font-semibold bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                  {currentAnswer.length} chars
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isListening
                  ? "bg-red-500 text-white animate-pulse shadow-red-200 hover:bg-red-600"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
              }`}
              title={isListening ? "Click to stop recording" : "Answer using speech-to-text microphone"}
            >
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  <span>Answer with Mic</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="px-6 pb-5 pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            if (jobDone) {
              onViewReport?.();
            } else {
              advance();
            }
          }}
          className="text-xs font-semibold py-2 transition-colors text-slate-500 hover:text-emerald-700 flex items-center gap-1"
        >
          {jobDone ? 'Skip Pitch & View Report Card →' : 'Skip'}
        </button>
        <button
          onClick={advance} disabled={!hasEnoughText}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all duration-150 ${hasEnoughText ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' : 'opacity-30 cursor-not-allowed bg-slate-300'}`}
        >
          <span>{currentQ === questions.length - 1 ? 'Submit & Evaluate' : 'Next Question'}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {currentQ === questions.length - 1 ? <polyline points="20 6 9 17 4 12" /> : <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>}
          </svg>
        </button>
      </div>
      <div className="px-6 pb-4"><p className="text-[10px] font-mono text-center text-slate-400">Ctrl+Enter to advance • Defense grade computed after last answer</p></div>
    </div>
  );
}

export function PendingReport({ jobId, status, currentPhase, inputType }: { jobId: string; status: string; currentPhase?: string | null; inputType?: string | null; }) {
  const router = useRouter();
  const ANALYSIS_STEPS = getSteps(inputType);
  const inputLabel = getInputLabel(inputType);
  const [livePhase, setLivePhase] = useState<string | null>(currentPhase || null);
  const [liveStatus, setLiveStatus] = useState<string>(status);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [isUserEngaged, setIsUserEngaged] = useState(false);
  const [autoRedirectSecs, setAutoRedirectSecs] = useState<number | null>(null);
  const jobDoneRef = useRef(false);
  const interviewDoneRef = useRef(false);

  const triggerCompletion = () => {
    setShowCompletionOverlay(true);
    setTimeout(() => router.refresh(), 1500);
  };

  useEffect(() => {
    if (liveStatus === 'COMPLETED') {
      jobDoneRef.current = true;
      if (interviewDoneRef.current) {
        triggerCompletion();
        return;
      }
      // If user hasn't started typing pitch answers, auto-transition after 3 seconds
      if (!isUserEngaged) {
        setAutoRedirectSecs(3);
      }
      return;
    }
    if (liveStatus === 'FAILED' || liveStatus === 'CANCELLED') {
      jobDoneRef.current = true;
      router.refresh();
      return;
    }
    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'phase_start' && data.phase) {
          setLivePhase(data.phase);
          if (liveStatus === 'PENDING') setLiveStatus('PROCESSING');
        } else if (data.type === 'phase_complete' && data.phase === 'save-report') {
          setLiveStatus('COMPLETED');
        }
      } catch (_) {}
    };
    return () => es.close();
  }, [jobId, liveStatus, isUserEngaged, router]);

  // Countdown timer when analysis is complete
  useEffect(() => {
    if (autoRedirectSecs === null) return;
    if (autoRedirectSecs <= 0) {
      triggerCompletion();
      return;
    }
    const timer = setTimeout(() => {
      setAutoRedirectSecs(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoRedirectSecs]);

  const handleInterviewAllAnswered = () => {
    interviewDoneRef.current = true;
    if (jobDoneRef.current) triggerCompletion();
  };

  const activeIndex = livePhase ? ANALYSIS_STEPS.findIndex(s => livePhase.toLowerCase().includes(s.id)) : liveStatus === 'PENDING' ? -1 : 0;
  const safeActiveIndex = activeIndex === -1 ? (liveStatus === 'PENDING' ? -1 : 0) : activeIndex;
  const [displayedIndex, setDisplayedIndex] = useState(Math.max(safeActiveIndex, 0));

  useEffect(() => { setDisplayedIndex(prev => Math.max(prev, safeActiveIndex)); }, [safeActiveIndex]);
  useEffect(() => {
    const t = setInterval(() => { setDisplayedIndex(prev => { const target = Math.max(safeActiveIndex, 0); return prev < target ? prev + 1 : prev; }); }, 9000);
    return () => clearInterval(t);
  }, [safeActiveIndex]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const t = setInterval(() => setElapsed(s => s + 1), 1000); return () => clearInterval(t); }, []);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  const [isCancelling, setIsCancelling] = useState(false);
  const handleCancel = async () => {
    setIsCancelling(true);
    try { await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' }); router.refresh(); }
    catch (err) { console.error('Failed to cancel job', err); setIsCancelling(false); }
  };

  const jobIsDone = liveStatus === 'COMPLETED';
  const progress = jobIsDone ? 100 : Math.min(((displayedIndex + 1) / ANALYSIS_STEPS.length) * 100, 100);

  return (
    <div className="min-h-screen text-slate-900 font-sans relative overflow-hidden bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-up-1{animation:fadeUp 0.5s 0.06s cubic-bezier(.16,1,.3,1) both}
        .fade-up-2{animation:fadeUp 0.5s 0.14s cubic-bezier(.16,1,.3,1) both}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}.overlay-in{animation:overlayIn .5s both}
        @keyframes overlayContentIn{from{opacity:0;transform:scale(.9) translateY(18px)}to{opacity:1;transform:scale(1) translateY(0)}}.overlay-content-in{animation:overlayContentIn .5s .1s both}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      ` }} />

      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Completion overlay */}
      {showCompletionOverlay && (
        <div className="fixed inset-0 z-50 overlay-in flex items-center justify-center bg-white/95 backdrop-blur-2xl">
          <div className="overlay-content-in flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black mb-1 tracking-tight text-slate-900">Analysis Complete</h2>
              <p className="text-xs font-mono text-slate-500">Loading your comprehensive report card...</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-600" style={{ animation: `blink 1.2s ${i*0.22}s step-end infinite` }} />)}
            </div>
          </div>
        </div>
      )}

      {/* Top navbar */}
      <header className="relative z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span className="font-bold text-sm text-slate-900">Deebug <span className="text-emerald-700 font-mono text-xs">/ Code Review Engine</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live {mins}:{secs}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-600 font-medium">
              {Math.round(progress)}% analyzed
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="relative z-10 flex flex-col lg:flex-row bg-[#f8fafc]" style={{ minHeight: 'calc(100vh - 57px)' }}>

        {/* LEFT: Pipeline tracker */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 lg:max-w-[600px] fade-up-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-slate-900">Live Progress Tracker</h1>
            <a href="/" className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Start New Review
            </a>
          </div>

          {/* Completion banner */}
          {jobIsDone && (
            <div className="rounded-2xl p-4 mb-4 bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Analysis 100% Complete!
                    {autoRedirectSecs !== null && <span className="ml-2 font-mono text-xs font-normal text-emerald-700">Loading report in {autoRedirectSecs}s...</span>}
                  </h3>
                  <p className="text-xs text-emerald-700">All 12 analysis phases have completed successfully.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={triggerCompletion}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>View Full Report Card</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          )}

          {/* Active pipeline card */}
          <div className="rounded-2xl p-5 mb-4 bg-white border border-slate-200 shadow-sm">
            <div className="mb-3">
              <p className="text-sm font-bold text-slate-900">Active Review Pipeline: <span className="text-emerald-700">{inputLabel} Analysis</span></p>
              <p className="text-[11px] font-mono mt-0.5 text-slate-400">Timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>

            {/* Progress bar */}
            <div className="mb-1.5">
              <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                <div className="h-full rounded-full transition-all duration-500 ease-out bg-emerald-600" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono text-slate-500">
                OVERALL PROGRESS: {Math.round(progress)}% ({jobIsDone ? 'Complete' : liveStatus === 'PENDING' ? 'Queued...' : `Running... ${mins}:${secs}`})
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700">{Math.round(progress)}%</span>
            </div>

            {/* Step rows */}
            <div className="space-y-1">
              {ANALYSIS_STEPS.map((step, idx) => {
                const isDone   = jobIsDone ? true : idx < displayedIndex;
                const isActive = jobIsDone ? false : idx === displayedIndex;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 ${
                      isActive ? 'bg-emerald-50 border border-emerald-200' : isDone ? 'bg-emerald-50/30 border border-emerald-100/60' : 'border border-transparent'
                    }`}
                    style={{ opacity: (!isDone && !isActive) ? 0.4 : 1 }}
                  >
                    <span className={`text-[13px] font-medium ${isActive ? 'text-slate-900 font-bold' : isDone ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      {idx + 1}. {step.label}{isDone ? '  ✓' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      {isDone && <span className="text-[11px] font-semibold text-emerald-700">Completed</span>}
                      {isActive && (
                        <>
                          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#059669"/>
                          </svg>
                          <span className="text-[11px] font-semibold text-emerald-700">RUNNING</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">{Math.round(progress)}%</span>
                        </>
                      )}
                      {!isDone && !isActive && <span className="text-[11px] font-mono text-slate-400">QUEUED</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cancel */}
          <div>
            <div className="rounded-xl p-3 flex items-center gap-3 border border-red-200 bg-red-50/50">
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-700">Abort Analysis</p>
                <p className="text-[10px] font-mono text-red-500">Stop active worker pipeline execution.</p>
              </div>
              <button onClick={handleCancel} disabled={isCancelling}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-150 disabled:opacity-40 text-red-700 border border-red-300 bg-white hover:bg-red-50">
                {isCancelling ? 'Stopping...' : 'Stop'}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-slate-200 my-6" />

        {/* RIGHT: Stats + Interview */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 lg:max-w-[580px] fade-up-2">

          {/* Pipeline stats */}
          <div className="rounded-2xl p-5 mb-5 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold mb-4 text-slate-900">Pipeline Stats</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-slate-900">1</p>
                <p className="text-[11px] mt-0.5 text-slate-500">Repos</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-emerald-700">{displayedIndex * 14}</p>
                <p className="text-[11px] mt-0.5 text-slate-500">Files</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-black text-amber-600">{displayedIndex}</p>
                <p className="text-[11px] mt-0.5 text-slate-500">Issues</p>
              </div>
            </div>
            <a href="/" className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700">
              Start New Review
            </a>
          </div>

          {/* Interview label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Developer Pitch</span>
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full text-slate-500 bg-slate-100 border border-slate-200">Optional</span>
          </div>

          {/* Interview card */}
          <div className="rounded-2xl overflow-hidden flex flex-col bg-white border border-slate-200 shadow-sm min-h-[400px]">
            <InterviewPanel
              jobId={jobId}
              jobDone={jobIsDone}
              onAllAnswered={handleInterviewAllAnswered}
              onViewReport={triggerCompletion}
              onUserActiveChange={(active) => {
                setIsUserEngaged(active);
                if (active) setAutoRedirectSecs(null);
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] font-mono text-slate-400">
            <span>Isolated Worker</span><span>•</span><span>In-Memory Parsing</span><span>•</span><span>Job: {jobId.slice(0, 10)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
