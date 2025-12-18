import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

import type { UserService } from '@/service/userService.js';
import { resetDatabase, runDemoSeed } from '@/util/demoSeed.js';

export interface DemoRoutesDependencies {
  userService: UserService;
  prisma: PrismaClient;
}

export function demoRoutes(
  fastify: FastifyInstance,
  options: { dependencies: DemoRoutesDependencies },
): void {
  if (process.env.DEMO_MODE !== 'true') {
    return;
  }

  const { userService, prisma } = options.dependencies;

  fastify.get('/demo/users', async () => {
    return userService.listUsers();
  });

  fastify.post('/demo/reset', async () => {
    await resetDatabase(prisma);
    await runDemoSeed(prisma);
    return { status: 'ok' };
  });
}
