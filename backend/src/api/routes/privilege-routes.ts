import type { FastifyInstance } from 'fastify';

import { ApplicationStatus, UserRole } from '@/domain/enums.js';
import type { Privilege, PrivilegeApplication } from '@/domain/types.js';
import type { PrivilegeService } from '@/service/privilegeService.js';

export interface PrivilegeRoutesDependencies {
  privilegeService: PrivilegeService;
}

export function privilegeRoutes(
  fastify: FastifyInstance,
  options: { dependencies: PrivilegeRoutesDependencies },
): void {
  const { privilegeService } = options.dependencies;

  fastify.get<{ Reply: Privilege[] | { error: string } }>(
    '/privileges',
    {
      schema: {
        tags: ['privileges'],
        summary: 'List privileges for the current practitioner',
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (user.role !== UserRole.PA) {
        return reply.code(403).send({ error: 'Only practitioners may view privileges' });
      }

      try {
        const privileges = await privilegeService.listPrivilegesForUser(user.id);
        return privileges;
      } catch (error) {
        request.log.error({ err: error }, 'failed to fetch privileges');
        const message = error instanceof Error ? error.message : 'Failed to fetch privileges';
        return reply.code(400).send({ error: message });
      }
    },
  );

  fastify.get<{ Reply: PrivilegeApplication[] | { error: string } }>(
    '/privileges/applications',
    {
      schema: {
        tags: ['privileges'],
        summary: 'List privilege applications for the current practitioner',
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (user.role !== UserRole.PA) {
        return reply.code(403).send({ error: 'Only practitioners may view applications' });
      }

      try {
        const applications = await privilegeService.listApplicationsForUser(user.id);
        return applications;
      } catch (error) {
        request.log.error({ err: error }, 'failed to fetch applications');
        const message =
          error instanceof Error ? error.message : 'Failed to fetch privilege applications';
        return reply.code(400).send({ error: message });
      }
    },
  );

  fastify.get<{ Reply: PrivilegeApplication[] | { error: string } }>(
    '/privileges/review',
    {
      schema: {
        tags: ['privileges'],
        summary: 'List under-review applications for the state admin member state',
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (user.role !== UserRole.STATE_ADMIN) {
        return reply.code(403).send({ error: 'Only state admins may review applications' });
      }

      if (!user.memberStateId) {
        return reply.code(400).send({ error: 'State admin missing member state' });
      }

      try {
        const applications = await privilegeService.listApplicationsForState(
          user.memberStateId,
          ApplicationStatus.UNDER_REVIEW,
        );
        return applications;
      } catch (error) {
        request.log.error({ err: error }, 'failed to fetch applications for review');
        const message =
          error instanceof Error ? error.message : 'Failed to fetch privilege applications';
        return reply.code(400).send({ error: message });
      }
    },
  );

  fastify.post(
    '/privileges/apply',
    {
      schema: {
        tags: ['privileges'],
        summary: 'Apply for a privilege (PA only)',
        body: {
          type: 'object',
          required: [
            'practitionerId',
            'remoteStateId',
            'qualifyingLicenseId',
            'attestationType',
            'attestationAccepted',
          ],
          properties: {
            practitionerId: { type: 'string', format: 'uuid' },
            remoteStateId: { type: 'string', format: 'uuid' },
            qualifyingLicenseId: { type: 'string', format: 'uuid' },
            attestationType: { type: 'string' },
            attestationAccepted: { type: 'boolean' },
            attestationText: { type: 'string', nullable: true },
            applicantNote: { type: 'string', nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      if (!request.user || request.user.role !== UserRole.PA) {
        return reply.code(403).send({ error: 'Only practitioners may apply' });
      }

      const application = await privilegeService.apply(request.body);
      return application;
    },
  );

  fastify.post(
    '/privileges/pay',
    {
      schema: {
        tags: ['privileges'],
        summary: 'Record payment for an application (PA only)',
        body: {
          type: 'object',
          required: ['applicationId', 'amount'],
          properties: {
            applicationId: { type: 'string', format: 'uuid' },
            amount: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      if (!request.user || request.user.role !== UserRole.PA) {
        return reply.code(403).send({ error: 'Only practitioners may pay' });
      }

      const application = await privilegeService.recordPayment(request.body);
      return application;
    },
  );

  fastify.post(
    '/privileges/verify',
    {
      schema: {
        tags: ['privileges'],
        summary: 'Approve or deny an application (State Admin only)',
        body: {
          type: 'object',
          required: ['applicationId', 'status'],
          properties: {
            applicationId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: [ApplicationStatus.APPROVED, ApplicationStatus.DENIED],
            },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      if (!request.user || request.user.role !== UserRole.STATE_ADMIN) {
        return reply.code(403).send({ error: 'Only state admins may verify applications' });
      }

      const result = await privilegeService.determineApplication({
        ...request.body,
        status: request.body.status,
      });

      return result;
    },
  );
}
