import type { FastifyInstance } from 'fastify';

import type { MemberStateService } from '@/service/memberStateService.js';
import type { MemberState } from '@/domain/types.js';
import { memberStateSchema } from '../docs/member-state-schemas.js';
import { errorSchema } from '../docs/shared-schemas.js';

export interface MemberStateRoutesDependencies {
  memberStateService: MemberStateService;
}

export function memberStateRoutes(
  fastify: FastifyInstance,
  options: { dependencies: MemberStateRoutesDependencies },
): void {
  const { memberStateService } = options.dependencies;

  fastify.get<{
    Reply: MemberState[] | { error: string };
  }>(
    '/states',
    {
      schema: {
        tags: ['states'],
        summary: 'List active member states',
        response: {
          200: {
            type: 'array',
            items: memberStateSchema,
          },
          500: errorSchema,
        },
      },
    },
    async () => {
      return memberStateService.list();
    },
  );
}
