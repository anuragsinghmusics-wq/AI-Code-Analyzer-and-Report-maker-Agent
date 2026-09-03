import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.job.findMany({
    select: { id: true, status: true, currentPhase: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(jobs, null, 2));
}
main().finally(() => prisma.$disconnect());
