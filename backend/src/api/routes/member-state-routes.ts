import type { FastifyInstance } from 'fastify';

import type { MemberStateService } from '@/service/memberStateService.js';
import type { MemberState } from '@/domain/types.js';

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
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string' },
                name: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
              required: ['id', 'code', 'name', 'isActive', 'createdAt', 'updatedAt'],
              additionalProperties: false,
            },
          },
        },
      },
    },
    async () => {
      return memberStateService.list();
    },
  );
}
