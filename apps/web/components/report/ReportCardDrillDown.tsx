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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border flex flex-col"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Report Card Drill-Down
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Score: <span className="font-bold" style={{ color: 'var(--accent)' }}>{report.overallScore}</span> ({report.overallGrade})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-800 transition-colors text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          
          {/* Executive Grading Rationale */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Executive Grading Rationale</h3>
            <div className="p-4 rounded border text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
              {report.summary}
            </div>
          </section>

          {/* Category Scores Breakdown */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Category Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.categoryScores.map((cat: CategoryScore) => (
                <div key={cat.category} className="p-4 rounded border flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                      <span className="text-sm px-2 py-0.5 rounded font-mono font-semibold" style={{ backgroundColor: 'var(--bg-overlay)', color: 'var(--info)' }}>
                        {cat.score.toFixed(1)} ({cat.grade})
                      </span>
                    </div>
                    
                    {cat.scoreReasoning && (
                      <div className="mt-2 p-2.5 rounded border border-amber-500/30 bg-amber-950/10 text-amber-200">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">⚖️ Score Rationale</p>
                        <p className="text-xs leading-relaxed text-gray-300">{cat.scoreReasoning}</p>
                      </div>
                    )}

                    {cat.analysis && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold mb-1 text-emerald-400">Analysis:</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {cat.analysis}
                        </p>
                      </div>
                    )}
                  </div>

                  {cat.improvement && (
                    <div className="mt-3 p-2 rounded bg-blue-900/20 border border-blue-800/30">
                      <p className="text-xs text-blue-300">💡 <strong className="text-blue-400">Improvement:</strong> {cat.improvement}</p>
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
