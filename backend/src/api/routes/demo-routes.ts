import type { FastifyInstance } from 'fastify';

import type { UserService } from '@/service/userService.js';

export interface DemoRoutesDependencies {
  userService: UserService;
}

export function demoRoutes(
  fastify: FastifyInstance,
  options: { dependencies: DemoRoutesDependencies },
): void {
  if (process.env.DEMO_MODE !== 'true') {
    return;
  }

  const { userService } = options.dependencies;

  fastify.get('/demo/users', async () => {
    return userService.listUsers();
  });
}
