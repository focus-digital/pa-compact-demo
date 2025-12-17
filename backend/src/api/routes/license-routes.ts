import type { FastifyInstance } from 'fastify';

import {
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  UserRole,
} from '@/domain/enums.js';
import type { License, QualifyingLicenseDesignation } from '@/domain/types.js';
import type { LicenseService } from '@/service/licenseService.js';

export interface LicenseRoutesDependencies {
  licenseService: LicenseService;
}

type LicenseCreateBody = {
  issuingStateId: string;
  licenseNumber: string;
  selfReportedStatus: LicenseSelfReportedStatus;
  issueDate: string;
  expirationDate: string;
  evidenceUrl?: string | null;
};

type LicenseVerifyBody = {
  licenseId: string;
  verificationStatus?: LicenseVerificationStatus;
  note?: string;
};

type LicenseDesignateBody = {
  licenseId: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
};

function parseDateOrThrow(input: string, field: string): Date {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${field}`);
  }
  return parsed;
}

export function licenseRoutes(
  fastify: FastifyInstance,
  options: { dependencies: LicenseRoutesDependencies },
): void {
  const { licenseService } = options.dependencies;

  fastify.get<{
    Querystring: { status?: LicenseVerificationStatus };
    Reply: License[] | { error: string };
  }>(
    '/licenses',
    {
      schema: {
        tags: ['licenses'],
        summary: 'List licenses for current user',
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const status = request.query.status;
      if (status && !Object.values(LicenseVerificationStatus).includes(status)) {
        return reply.code(400).send({ error: 'Invalid status query param' });
      }

      try {
        const licenses = await licenseService.getLicenses({
          userId: user.id,
          role: user.role,
          memberStateId: user.memberStateId,
          status,
        });
        return licenses;
      } catch (error) {
        request.log.error({ err: error }, 'failed to fetch licenses');
        const message = error instanceof Error ? error.message : 'Failed to fetch licenses';
        const statusCode = message.includes('Unauthorized') ? 403 : 400;
        return reply.code(statusCode).send({ error: message });
      }
    },
  );

  fastify.post<{
    Body: LicenseCreateBody;
    Reply: License | { error: string };
  }>(
    '/licenses',
    {
      schema: {
        tags: ['licenses'],
        summary: 'Create a license (PA only)',
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (user.role !== UserRole.PA) {
        return reply.code(403).send({ error: 'Only practitioners can create licenses.' });
      }

      const practitioner = await licenseService.practitionerRepo.fetchByUserId(user.id);
      if (!practitioner) {
        return reply.code(400).send({ error: 'Practitioner not found for user' });
      }

      let issueDate: Date;
      let expirationDate: Date;

      try {
        issueDate = parseDateOrThrow(request.body.issueDate, 'issueDate');
        expirationDate = parseDateOrThrow(request.body.expirationDate, 'expirationDate');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid date';
        return reply.code(400).send({ error: message });
      }

      const license = await licenseService.addLicense({
        practitionerId: practitioner.id,
        issuingStateId: request.body.issuingStateId,
        licenseNumber: request.body.licenseNumber,
        issueDate,
        expirationDate,
        selfReportedStatus: request.body.selfReportedStatus,
        evidenceUrl: request.body.evidenceUrl,
      });

      return license;
    },
  );

  fastify.post<{
    Body: LicenseVerifyBody;
    Reply: License | { error: string };
  }>(
    '/licenses/verify',
    {
      schema: {
        tags: ['licenses'],
        summary: 'Verify a license (State Admin only)',
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (user.role !== UserRole.STATE_ADMIN) {
        return reply.code(403).send({ error: 'Only state admins can verify licenses' });
      }

      if (!user.memberStateId) {
        return reply.code(400).send({ error: 'State admin missing member state' });
      }

      const license = await licenseService.getLicenseById(request.body.licenseId);
      if (!license) {
        return reply.code(404).send({ error: 'License not found' });
      }

      if (license.issuingStateId !== user.memberStateId) {
        return reply
          .code(403)
          .send({ error: 'Cannot verify licenses outside your member state' });
      }

      const verificationStatus =
        request.body.verificationStatus ?? LicenseVerificationStatus.VERIFIED;

      if (!Object.values(LicenseVerificationStatus).includes(verificationStatus)) {
        return reply.code(400).send({ error: 'Invalid verification status' });
      }

      const updated = await licenseService.verifyLicense({
        licenseId: request.body.licenseId,
        verificationStatus,
        note: request.body.note,
        actorUserId: user.id,
      });

      return updated;
    },
  );

  fastify.post<{
    Body: LicenseDesignateBody;
    Reply: QualifyingLicenseDesignation | { error: string };
  }>(
    '/licenses/designate',
    {
      schema: {
        tags: ['licenses'],
        summary: 'Designate a license as qualifying (PA only)',
      },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      if (user.role !== UserRole.PA) {
        return reply.code(403).send({ error: 'Only practitioners can designate a license' });
      }

      const practitioner = await licenseService.practitionerRepo.fetchByUserId(user.id);
      if (!practitioner) {
        return reply.code(400).send({ error: 'Practitioner not found for user' });
      }

      const license = await licenseService.getLicenseById(request.body.licenseId);
      if (!license) {
        return reply.code(404).send({ error: 'License not found' });
      }

      if (license.practitionerId !== practitioner.id) {
        return reply.code(403).send({ error: 'Update not allowed' });
      }

      if (license.verificationStatus !== LicenseVerificationStatus.VERIFIED) {
        return reply.code(400).send({ error: 'License must be verified before designation' });
      }

      let effectiveFrom: Date | null | undefined;
      let effectiveTo: Date | null | undefined;

      if (license.expirationDate.getTime() < new Date().getTime()) {
        return reply.code(400).send({ error: 'This license is expired.' });
        // TODO move status?
      }
      
      const designation = await licenseService.designateAsQualifyingLicense({
        practitionerId: practitioner.id,
        licenseId: request.body.licenseId,
        effectiveFrom: license.issueDate,
        effectiveTo: license.expirationDate,
        actorUserId: user.id,
      });

      return designation;
    },
  );
}
