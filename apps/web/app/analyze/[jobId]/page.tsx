// apps/web/app/analyze/[jobId]/page.tsx — Streaming progress + report placeholder
export default function JobPage({ params }: { params: { jobId: string } }) {
  return <div>Job: {params.jobId}</div>;
}
