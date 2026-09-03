const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.job.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  include: { report: true }
})
.then(jobs => {
  console.log('JOBS:', JSON.stringify(jobs, null, 2));
  return p.$disconnect();
})
.catch(err => {
  console.error(err);
  return p.$disconnect();
});
