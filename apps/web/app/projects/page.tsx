import Link from "next/link";
import { prisma } from "@code-analyzer/db";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let jobs: any[] = [];
  try {
    jobs = await prisma.job.findMany({
      include: { report: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Failed to fetch projects:", err);
  }

  // Aggregate by repoUrl or uploaded bundle
  const projectMap = new Map<string, {
    name: string;
    repoUrl: string | null;
    totalRuns: number;
    lastRunDate: Date;
    latestGrade: string;
    latestScore: number | null;
    latestJobId: string;
  }>();

  jobs.forEach((job) => {
    const key = job.repoUrl || "Manual Uploads";
    const name = job.repoUrl ? job.repoUrl.replace("https://github.com/", "") : "Direct Upload Archives";
    const existing = projectMap.get(key);
    if (!existing) {
      projectMap.set(key, {
        name,
        repoUrl: job.repoUrl,
        totalRuns: 1,
        lastRunDate: new Date(job.createdAt),
        latestGrade: job.report?.grade || "N/A",
        latestScore: job.report?.overallScore != null ? Math.round(job.report.overallScore) : null,
        latestJobId: job.id,
      });
    } else {
      existing.totalRuns += 1;
    }
  });

  const projects = Array.from(projectMap.values());

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-zinc-950 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-200 px-8 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <h1 className="text-sm font-black tracking-wide text-zinc-950 uppercase font-mono">
            Audited Projects
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-mono font-bold">
            {projects.length} Repositories
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
          Audit New Project
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 max-w-6xl w-full mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Monitored Codebases</h2>
          <p className="text-xs text-zinc-700 font-medium mt-1">
            Continuous static analysis benchmarks, security posture, and architectural health across all analyzed repositories.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-mono text-lg font-bold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-950">No projects yet</h3>
            <p className="text-xs text-zinc-600 font-medium mt-1 max-w-sm mx-auto">
              Analyze a GitHub repository or zip archive from the dashboard to track project health.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            >
              Analyze Codebase
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((proj) => (
              <div
                key={proj.name}
                className="rounded-xl border border-zinc-200 bg-white hover:border-emerald-500 shadow-sm transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-mono text-xs font-bold">
                        &lt;&gt;
                      </div>
                      <h3 className="text-sm font-bold text-zinc-950 truncate max-w-xs">{proj.name}</h3>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                      Grade {proj.latestGrade}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-700 font-mono font-medium">
                    Audits: {proj.totalRuns} | Last audit: {proj.lastRunDate.toLocaleDateString()}
                  </p>
                  {proj.latestScore !== null && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] font-mono text-zinc-700 mb-1 font-bold">
                        <span>Quality Index</span>
                        <span className="text-emerald-700 font-black">{proj.latestScore}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                          style={{ width: `${proj.latestScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  {proj.repoUrl ? (
                    <a
                      href={proj.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-700 hover:text-zinc-950 font-bold transition-colors flex items-center gap-1 font-mono"
                    >
                      GitHub Repo
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-400 font-mono">Direct Archive</span>
                  )}

                  <Link
                    href={`/report/${proj.latestJobId}`}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    Latest Report
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
