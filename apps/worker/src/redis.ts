// apps/worker/src/redis.ts — Shared Redis connection for BullMQ
import Redis from 'ioredis';
import { config } from '@code-analyzer/shared/config';
import { logger } from '@code-analyzer/shared/logger';

/**
 * Shared IORedis connection options for BullMQ queues and workers.
 * BullMQ requires maxRetriesPerRequest to be null.
 */
export function createRedisConnection(): Redis {
  const connection = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on('error', (err) => {
    logger.error({ err }, 'Redis connection error in worker');
  });

  connection.on('connect', () => {
    logger.info('Worker connected to Redis');
  });

  return connection;
}
