/**
 * Privilege Routes Tests
 *
 * Simulate a full flow on two practitioners:
 *  - create and designate qualifying licenses
 *  - apply for privileges in a remote state
 *  - record payments
 *  - determine applications (approve and deny)
 */

import type { FastifyInstance } from 'fastify';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';

import { createTestApp, closeTestApp, login } from '../helpers/test-app.js';
import { prisma } from '../test-setup.js';
import { AuthService } from '@/service/authService.js';
import {
  ApplicationStatus,
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  UserRole,
} from '@/domain/enums.js';
import type { Practitioner, Privilege, PrivilegeApplication, SearchResult, User } from '@/domain/types.js';
import { MemberStateRepo } from '@/repo/memberStateRepo.js';
import type { LicenseService } from '@/service/licenseService.js';

const PASSWORD = 'Password123!';

describe('Privilege routes', () => {
  let app: FastifyInstance;
  let homeStateId: string;
  let homeStateCode: string;
  let remoteStateId: string;
  let paCookie: string;
  let pa2Cookie: string;
  let remoteAdminCookie: string;
  let practitioner1: Practitioner;
  let practitioner2: Practitioner;
  let paUser1: User;
  let paUser2: User;
  let licenseId1: string;
  let licenseId2: string;
  let applicationId1: string;
  let applicationId2: string;
  let paUserPrivilegeId: string;

  beforeAll(async () => {
    const createAppResponse = await createTestApp();
    app = createAppResponse.app;
    const {
      userService,
      authService,
      practitionerService,
      licenseService: licenseServiceDep,
    } = createAppResponse.appDependencies;

    const licenseService = licenseServiceDep as LicenseService;
    const memberStateRepo = new MemberStateRepo(prisma);

    const homeState = await memberStateRepo.create({
      code: 'MA',
      name: 'Massachusetts',
    });
    homeStateId = homeState.id;
    homeStateCode = homeState.code;

    const remoteState = await memberStateRepo.create({
      code: 'MD',
      name: 'Maryland',
    });
    remoteStateId = remoteState.id;

    const passwordHash = await AuthService.hashPassword(PASSWORD);

    paUser1 = (await userService?.ensureUser({
      email: 'pa.priv1@example.com',
      firstName: 'Alex',
      lastName: 'Applicant',
      role: UserRole.PA,
      passwordHash,
    })) as User;
    practitioner1 = (await practitionerService?.createPractitioner({
      userId: paUser1.id,
    })) as Practitioner;

    paUser2 = (await userService?.ensureUser({
      email: 'pa.priv2@example.com',
      firstName: 'Taylor',
      lastName: 'Applicant',
      role: UserRole.PA,
      passwordHash,
    })) as User;
    practitioner2 = (await practitionerService?.createPractitioner({
      userId: paUser2.id,
    })) as Practitioner;

    await userService?.ensureUser({
      email: 'remote-admin-priv@example.com',
      firstName: 'Remote',
      lastName: 'Admin',
      role: UserRole.STATE_ADMIN,
      memberStateId: remoteStateId,
      passwordHash,
    });

    paCookie = await login(app, paUser1.email, PASSWORD);
    pa2Cookie = await login(app, paUser2.email, PASSWORD);
    remoteAdminCookie = await login(app, 'remote-admin-priv@example.com', PASSWORD);

    const license1 = await licenseService.addLicense({
      practitionerId: practitioner1.id,
      issuingStateId: homeStateId,
      licenseNumber: 'LIC-PRIV-1',
      issueDate: new Date('2023-01-01'),
      expirationDate: new Date('2025-01-01'),
      selfReportedStatus: LicenseSelfReportedStatus.ACTIVE,
    });
    licenseId1 = license1.id;
    await licenseService.verifyLicense({
      licenseId: licenseId1,
      verificationStatus: LicenseVerificationStatus.VERIFIED,
    });
    await licenseService.designateAsQualifyingLicense({
      practitionerId: practitioner1.id,
      licenseId: licenseId1,
      actorUserId: paUser1.id,
    });

    const license2 = await licenseService.addLicense({
      practitionerId: practitioner2.id,
      issuingStateId: homeStateId,
      licenseNumber: 'LIC-PRIV-2',
      issueDate: new Date('2023-02-01'),
      expirationDate: new Date('2025-02-01'),
      selfReportedStatus: LicenseSelfReportedStatus.ACTIVE,
    });
    licenseId2 = license2.id;
    await licenseService.verifyLicense({
      licenseId: licenseId2,
      verificationStatus: LicenseVerificationStatus.VERIFIED,
    });
    await licenseService.designateAsQualifyingLicense({
      practitionerId: practitioner2.id,
      licenseId: licenseId2,
      actorUserId: paUser2.id,
    });
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('application flow', () => {
    it('PA submits a privilege application', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/apply',
        headers: { cookie: paCookie },
        payload: {
          practitionerId: practitioner1.id,
          remoteStateId,
          qualifyingLicenseId: licenseId1,
          attestationType: 'demo_attestation',
          attestationAccepted: true,
          attestationText: 'Demo attestation text',
          applicantNote: 'Ready to practice',
        },
      });

      expect(response.statusCode).toBe(200);
      const application = response.json() as { id: string; status: ApplicationStatus };
      expect(application.status).toBe(ApplicationStatus.SUBMITTED);
      applicationId1 = application.id;
    });

    it('rejects applying if the user is not a PA', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/apply',
        headers: { cookie: remoteAdminCookie },
        payload: {
          practitionerId: practitioner1.id,
          remoteStateId,
          qualifyingLicenseId: licenseId1,
          attestationType: 'demo_attestation',
          attestationAccepted: true,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({ error: 'Only practitioners may apply' });
    });

    it('Second PA submits a privilege application', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/apply',
        headers: { cookie: pa2Cookie },
        payload: {
          practitionerId: practitioner2.id,
          remoteStateId,
          qualifyingLicenseId: licenseId2,
          attestationType: 'demo_attestation',
          attestationAccepted: true,
          applicantNote: 'Ready for remote practice',
        },
      });

      expect(response.statusCode).toBe(200);
      const application = response.json() as { id: string; status: ApplicationStatus };
      expect(application.status).toBe(ApplicationStatus.SUBMITTED);
      applicationId2 = application.id;
    });

    it('PA records payment for application', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/pay',
        headers: { cookie: paCookie },
        payload: {
          applicationId: applicationId1,
          amount: 20000,
        },
      });

      expect(response.statusCode).toBe(200);
      const application = response.json() as { status: ApplicationStatus };
      expect(application.status).toBe(ApplicationStatus.UNDER_REVIEW);
    });

    it('rejects payment if user is not a PA', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/pay',
        headers: { cookie: remoteAdminCookie },
        payload: {
          applicationId: applicationId1,
          amount: 9999,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({ error: 'Only practitioners may pay' });
    });

    it('Second PA records payment for application', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/pay',
        headers: { cookie: pa2Cookie },
        payload: {
          applicationId: applicationId2,
          amount: 15000,
        },
      });

      expect(response.statusCode).toBe(200);
      const application = response.json() as { status: ApplicationStatus };
      expect(application.status).toBe(ApplicationStatus.UNDER_REVIEW);
    });

    it('State admin lists under-review applications for their member state', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges/review',
        headers: { cookie: remoteAdminCookie },
      });

      expect(response.statusCode).toBe(200);
      const applications = response.json() as PrivilegeApplication[];
      expect(applications).toHaveLength(2);
      expect(applications.every((app) => app.status === ApplicationStatus.UNDER_REVIEW)).toBe(true);
      expect(applications.every((app) => app.remoteStateId === remoteStateId)).toBe(true);
    });

    it('rejects review listing for non state admins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges/review',
        headers: { cookie: paCookie },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({
        error: 'Only state admins may review applications',
      });
    });

    it('rejects verification if user is not a state admin', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/verify',
        headers: { cookie: paCookie },
        payload: {
          applicationId: applicationId1,
          status: ApplicationStatus.APPROVED,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({
        error: 'Only state admins may verify applications',
      });
    });

    it('State admin approves an application and privilege is issued', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/verify',
        headers: { cookie: remoteAdminCookie },
        payload: {
          applicationId: applicationId1,
          status: ApplicationStatus.APPROVED,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json() as {
        application: { status: ApplicationStatus };
        privilege: { id: string, status: string };
      };
      paUserPrivilegeId = result.privilege.id;
      expect(result.application.status).toBe(ApplicationStatus.APPROVED);
      expect(result.privilege?.status).toBe('ACTIVE');
    });

    it('State admin denies another application', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/privileges/verify',
        headers: { cookie: remoteAdminCookie },
        payload: {
          applicationId: applicationId2,
          status: ApplicationStatus.DENIED,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = response.json() as {
        application: { status: ApplicationStatus };
        privilege?: unknown;
      };
      expect(result.application.status).toBe(ApplicationStatus.DENIED);
      expect(result.privilege).toBeUndefined();
    });
  });

  describe('listing endpoints', () => {
    it('lists applications for a practitioner', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges/applications',
        headers: { cookie: paCookie },
      });

      expect(response.statusCode).toBe(200);
      const applications = response.json() as PrivilegeApplication[];
      expect(applications).toHaveLength(1);
      expect(applications[0]?.id).toBe(applicationId1);
      expect(applications[0]?.remoteStateId).toBe(remoteStateId);
    });

    it('lists issued privileges for a practitioner', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges',
        headers: { cookie: paCookie },
      });

      expect(response.statusCode).toBe(200);
      const privileges = response.json() as Privilege[];
      expect(privileges).toHaveLength(1);
      expect(privileges[0]?.applicationId).toBe(applicationId1);
    });

    it('rejects listing privileges for non-PAs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges',
        headers: { cookie: remoteAdminCookie },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({ error: 'Only practitioners may view privileges' });
    });
  });

  describe('search endpoint', () => {
    it('allows state admins to search by name', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges/search',
        query: { name: 'Alex' },
      });

      expect(response.statusCode).toBe(200);
      const results = response.json() as SearchResult[];
      expect(results).toHaveLength(1);
      expect(results[0]?.practitioner.id).toBe(practitioner1.id);
      expect(results[0]?.qualifyingLicense.issuingStateId).toBe(homeStateId);
      expect(results[0]?.privileges.length).toBe(1);
      expect(results[0]?.privileges[0]?.id).toBe(paUserPrivilegeId);
    });

    it('filters by qualifying license state', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges/search',
        query: { name: 'Alex', qualifyingLicenseState: homeStateCode },
      });

      expect(response.statusCode).toBe(200);
      const results = response.json() as SearchResult[];
      expect(results).toHaveLength(1);

      const noMatchResponse = await app.inject({
        method: 'GET',
        url: '/privileges/search',
        query: { name: 'Alex', qualifyingLicenseState: 'ZZ' },
      });

      expect(noMatchResponse.statusCode).toBe(200);
      const noMatch = noMatchResponse.json() as SearchResult[];
      expect(noMatch).toHaveLength(0);
    });

    it('validates missing name', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/privileges/search',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ "error": "Bad Request" });
    });
  });
});
