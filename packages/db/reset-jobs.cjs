const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.job.updateMany({ where: { status: { in: ['PROCESSING', 'FAILED', 'COMPLETED'] } }, data: { status: 'PENDING' } })
  .then(r => { console.log('Reset:', JSON.stringify(r)); return p.$disconnect(); });
