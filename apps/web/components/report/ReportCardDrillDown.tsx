// apps/web/components/report/ReportCardDrillDown.tsx
'use client';

import React from 'react';
import type { ReportCard, CategoryScore } from '@code-analyzer/shared';

interface Props {
  report: ReportCard;
  onClose: () => void;
}

export function ReportCardDrillDown({ report, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border flex flex-col bg-white shadow-xl"
        style={{ borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Report Card Drill-Down
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Score: <span className="font-bold text-emerald-700">{report.overallScore}</span> ({report.overallGrade})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          
          {/* Executive Grading Rationale */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">Executive Grading Rationale</h3>
            <div className="p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 border-slate-200 text-slate-800">
              {report.summary}
            </div>
          </section>

          {/* Category Scores Breakdown */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">Category Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.categoryScores.map((cat: CategoryScore) => (
                <div key={cat.category} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-900">{cat.category}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                        {cat.score.toFixed(1)} ({cat.grade})
                      </span>
                    </div>
                    
                    {cat.scoreReasoning && (
                      <div className="mt-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">⚖️ Score Rationale</p>
                        <p className="text-xs leading-relaxed text-amber-950">{cat.scoreReasoning}</p>
                      </div>
                    )}

                    {cat.analysis && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold mb-1 text-emerald-800">Analysis:</p>
                        <p className="text-xs leading-relaxed text-slate-600">
                          {cat.analysis}
                        </p>
                      </div>
                    )}
                  </div>

                  {cat.improvement && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-xs text-emerald-900">💡 <strong className="text-emerald-800">Improvement:</strong> {cat.improvement}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
