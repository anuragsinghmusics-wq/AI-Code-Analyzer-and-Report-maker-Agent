import Link from "next/link";
import { prisma } from "@code-analyzer/db";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let jobs: any[] = [];
  try {
    jobs = await prisma.job.findMany({
      include: { report: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (err) {
    console.error("Failed to fetch reports:", err);
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-zinc-950 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-200 px-8 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <h1 className="text-sm font-black tracking-wide text-zinc-950 uppercase font-mono">
            Analysis Reports
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-mono font-bold">
            {jobs.length} Generated
          </span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-150 shadow-sm"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Analysis
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 max-w-6xl w-full mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Audit History & Executive Reports</h2>
          <p className="text-xs text-zinc-700 font-medium mt-1">
            Browse all automated architectural reviews, grading scorecards, and interactive evaluations.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-mono text-lg font-bold">
              &lt;/&gt;
            </div>
            <h3 className="text-sm font-bold text-zinc-950">No reports yet</h3>
            <p className="text-xs text-zinc-600 font-medium mt-1 max-w-sm mx-auto">
              Run your first static code analysis from the dashboard to generate comprehensive report cards.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            >
              Start New Analysis
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job) => {
              const hasReport = !!job.report;
              const grade = job.report?.grade || "—";
              const overallScore = job.report?.overallScore != null ? Math.round(job.report.overallScore) : null;
              const dateStr = new Date(job.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-zinc-200 bg-white hover:border-emerald-500 shadow-sm transition-all duration-150 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start md:items-center gap-3.5">
                    {/* Score / Grade Pill */}
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-base font-black text-zinc-950 font-mono leading-none">
                        {grade}
                      </span>
                      {overallScore !== null && (
                        <span className="text-[10px] text-emerald-700 font-mono mt-0.5 font-black">
                          {overallScore}%
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-zinc-950 truncate max-w-md">
                          {job.repoUrl
                            ? job.repoUrl.replace("https://github.com/", "")
                            : `Archive Analysis (${job.fileCount} files)`}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold ${
                            job.status === "COMPLETED"
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                              : job.status === "FAILED"
                              ? "bg-rose-50 border border-rose-200 text-rose-800"
                              : "bg-amber-50 border border-amber-200 text-amber-800 animate-pulse"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-600 font-mono font-medium">
                        <span>ID: {job.id.slice(0, 10)}...</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        {job.durationMs && (
                          <>
                            <span>•</span>
                            <span>{(job.durationMs / 1000).toFixed(1)}s runtime</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <Link
                      href={`/report/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      {hasReport ? "View Report" : "Inspect Progress"}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
