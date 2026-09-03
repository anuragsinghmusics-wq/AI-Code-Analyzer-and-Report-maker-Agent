import { prisma } from './packages/db/dist/index.js';
const questions = await prisma.question.findMany({
  where: { report: { jobId: 'cms8mu4dx000245qebszt1ox6' } },
  select: { index: true, text: true, options: true }
});
for (const q of questions) {
  console.log(`Q${q.index}: options=${q.options}`);
}
await prisma.$disconnect();
