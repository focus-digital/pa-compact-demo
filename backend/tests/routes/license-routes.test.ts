/**
 * License Routes Tests
 * 
 * Tests the license endpoints including by simulating a flow on the same data set across routes:
 * - PA adds a license
 * - STATE_ADMIN verifies a license
 * - PA designates a qualifying license
 * 
 * Also tests
 * - Authentication and authorization
 * - Error states
 * - Specific conditional logic and side effects
 * 
 * @module tests/routes/users
 */

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest';

import { createTestApp, closeTestApp, login } from '../helpers/test-app.js';
import { prisma } from '../test-setup.js';
import { AuthService } from '@/service/authService.js';
import {
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  QualifyingLicenseDesignationStatus,
  UserRole,
} from '@/domain/enums.js';
import type { License, Practitioner, User } from '@/domain/types.js';
import { SESSION_COOKIE_NAME } from '@/api/plugins/userAuth.js';
import { MemberStateRepo } from '@/repo/memberStateRepo.js';
import type { LicenseService } from '@/service/licenseService.js';

const PASSWORD = 'Password123!';
const INVALID_COOKIE = `${SESSION_COOKIE_NAME}=INVALID`;

describe('License routes', () => {
  let app: FastifyInstance;

  let homeStateId: string;
  let homeState2Id: string;
  let remoteStateId: string;
  let practitionerId: string;
  let practitioner2Id: string;
  let paCookie: string;
  let pa2Cookie: string;
  let paDetachedCookie: string;
  let homeAdminCookie: string;
  let remoteAdminCookie: string;
  let home2AdminCookie: string;
  let homeLicenseId: string;
  let home2LicenseId: string;
  let licenseService: LicenseService;

  beforeAll(async () => {
    const createAppResponse = await createTestApp();
    app = createAppResponse.app;
    const { userService, authService, licenseService: licenseServiceDep, practitionerService } = createAppResponse.appDependencies;
    licenseService = licenseServiceDep as LicenseService;
    const memberStateRepo = new MemberStateRepo(prisma);

    // Create member states
    const homeState = await memberStateRepo.create({
      code: 'MA',
      name: 'Massachusetts',
    })
    homeStateId = homeState.id;

    const homeState2 = await memberStateRepo.create({
      code: 'AK',
      name: 'Arkansas',
    });
    homeState2Id = homeState2.id;

    const remoteState = await memberStateRepo.create({
      code: 'MD',
      name: 'Maryland',
    });
    remoteStateId = remoteState.id;

    // Create PA and State Admins
    const passwordHash = await AuthService.hashPassword(PASSWORD);

    // PA Users
    const paUser = await userService?.ensureUser({
      email: 'pa@example.com',
      firstName: 'Pa',
      lastName: 'User',
      role: UserRole.PA,
      passwordHash,
    }) as User;

    const practitioner = await practitionerService?.createPractitioner({
      userId: paUser.id,
    }) as Practitioner;
    practitionerId = practitioner?.id;

    const paUser2 = await userService?.ensureUser({
      email: 'pa2@example.com',
      firstName: 'Pa',
      lastName: 'User',
      role: UserRole.PA,
      passwordHash,
    }) as User;

    const practitioner2 = await practitionerService?.createPractitioner({
      userId: paUser2.id,
    }) as Practitioner;
    practitioner2Id = practitioner2?.id;

    // Detached PA user
    const paUserDetached = await userService?.ensureUser({
      email: 'pa-detached@example.com',
      firstName: 'Pa',
      lastName: 'Detached',
      role: UserRole.PA,
      passwordHash,
    });

    // State Admins
    await await userService?.ensureUser({
      email: 'home-admin@example.com',
      firstName: 'Home',
      lastName: 'Admin',
      role: UserRole.STATE_ADMIN,
      memberStateId: homeStateId,
      passwordHash,
    });

    await await userService?.ensureUser({
      email: 'home2-admin@example.com',
      firstName: 'Home',
      lastName: 'Two',
      role: UserRole.STATE_ADMIN,
      memberStateId: homeState2Id,
      passwordHash,
    });

    await userService?.ensureUser({
      email: 'remote-admin@example.com',
      firstName: 'Remote',
      lastName: 'Admin',
      role: UserRole.STATE_ADMIN,
      memberStateId: remoteStateId,
      passwordHash,
    });

    // login users
    paCookie = await login(app, 'pa@example.com', PASSWORD);
    pa2Cookie = await login(app, 'pa2@example.com', PASSWORD);
    paDetachedCookie = await login(app, 'pa-detached@example.com', PASSWORD);
    homeAdminCookie = await login(app, 'home-admin@example.com', PASSWORD);
    home2AdminCookie = await login(app, 'home2-admin@example.com', PASSWORD);
    remoteAdminCookie = await login(app, 'remote-admin@example.com', PASSWORD);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
  });

  describe('adding a license', () => {
    it('requires a logged in user', async () => {
      const response = await createLicense(
        app, INVALID_COOKIE, homeStateId
      )
      expect(response.statusCode).toBe(401);
    })

    it('requires a PA role', async () => {
      const response = await createLicense(
        app, homeAdminCookie, homeStateId
      )
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({ error: 'Only practitioners can create licenses.' });
    })

    it('requires a PA role with a practitioner row', async () => {
      const response = await createLicense(
        app, paDetachedCookie, homeStateId
      )
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ error: 'Practitioner not found for user' });
    })

    it('creates a license', async () => {
      const response = await createLicense(
        app, paCookie, homeStateId
      )
      expect(response.statusCode).toBe(200);
      const responseObj = response.json();
      homeLicenseId = responseObj.id;
      expect(responseObj.practitionerId).toBe(practitionerId);
      expect(responseObj.verificationStatus).toBe(LicenseVerificationStatus.UNVERIFIED);
    })

    it('creates another license', async () => {
      const response = await createLicense(
        app, paCookie, homeState2Id
      )
      expect(response.statusCode).toBe(200);
      const responseObj = response.json();
      home2LicenseId = responseObj.id;
      expect(responseObj.practitionerId).toBe(practitionerId);
      expect(responseObj.verificationStatus).toBe(LicenseVerificationStatus.UNVERIFIED);
    })
  })

  describe('fetching licenses', () => {
    it('requires a logged in user', async () => {
      const response = await getLicenses(app, INVALID_COOKIE);
      expect(response.statusCode).toBe(401);
    })

    it('should fetch own licenses for PA user', async () => {
      const response = await getLicenses(app, paCookie);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveLength(2);
    })

    it('should fetch UNVERIFIED licenses for STATE_ADMIN user in their member state', async () => {
      const response = await getLicenses(app, homeAdminCookie);
      expect(response.statusCode).toBe(200);
      const responseBody = response.json();
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].id).toBe(homeLicenseId);
      expect(responseBody[0].verificationStatus).toBe(LicenseVerificationStatus.UNVERIFIED);
    })

    // TODO it('should can filter by status', async () => {})
  })

  describe('verifying licenses', () => {
    it('requires a logged in user', async () => {
      const response = await verifyLicense(app, INVALID_COOKIE, homeLicenseId);
      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({ error: 'Unauthorized' });
    });

    it('requires a STATE_ADMIN role in user', async () => {
      const response = await verifyLicense(app, paCookie, homeLicenseId);
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({ error: 'Only state admins can verify licenses' });
    });

    it('STATE_ADMIN should be of same member state as license issuingStateId', async () => {
      const response = await verifyLicense(app, remoteAdminCookie, homeLicenseId);
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: 'Cannot verify licenses outside your member state',
      });
    });

    it('STATE_ADMIN can verify a user', async () => {
      const response = await verifyLicense(app, homeAdminCookie, homeLicenseId);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        id: homeLicenseId,
        verificationStatus: LicenseVerificationStatus.VERIFIED,
      });
    });
  })

  describe('designate a licenses', () => {
    it('requires a logged in user', async () => {
      const response = await designateLicense(app, INVALID_COOKIE, homeLicenseId);
      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({ error: 'Unauthorized' });
    });

    it('requires a PA role in user', async () => {
      const response = await designateLicense(app, homeAdminCookie, homeLicenseId);
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: 'Only practitioners can designate a license',
      });
    });

    it('requires a PA role and Practitioner row', async () => {
      const response = await designateLicense(app, paDetachedCookie, homeLicenseId);
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'Practitioner not found for user',
      });
    });

    it('requires the license to exist', async () => {
      const response = await designateLicense(app, paCookie, randomUUID());
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ error: 'License not found' });
    });

    it('requires license ownership', async () => {
      const otherLicenseId = (await createLicense(app, pa2Cookie, homeStateId)).json().id;
      const response = await designateLicense(app, paCookie, otherLicenseId);
      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({ error: 'Update not allowed' });
    })    

    it('PA can designate a license', async () => {
      const response = await designateLicense(app, paCookie, homeLicenseId);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        licenseId: homeLicenseId,
        practitionerId,
        status: QualifyingLicenseDesignationStatus.ACTIVE,
      });
    });

    it('requires license verification first', async () => {
      const response = await designateLicense(app, paCookie, home2LicenseId);
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'License must be verified before designation',
      });      
    });

    it('PA can designate a another license, first one is archived', async () => {
      const verifyResponse = await verifyLicense(app, home2AdminCookie, home2LicenseId);
      expect(verifyResponse.statusCode).toBe(200);

      const designateResponse = await designateLicense(app, paCookie, home2LicenseId);
      expect(designateResponse.statusCode).toBe(200);

      const designations = await licenseService.getDesignations(practitionerId);
      expect(designations).toBeDefined();
      expect(designations).toHaveLength(2);
      expect(designations[0]?.status).toBe(QualifyingLicenseDesignationStatus.ACTIVE);
      expect(designations[0]?.licenseId).toBe(home2LicenseId);
      expect(designations[1]?.status).toBe(QualifyingLicenseDesignationStatus.ARCHIVED);
      expect(designations[1]?.licenseId).toBe(homeLicenseId);
    });
  })
});

async function getLicenses(
  app: FastifyInstance,
  cookie: string,
) {
  return app.inject({
    method: 'GET',
    url: '/licenses',
    headers: { cookie }
  });
}

async function createLicense(
  app: FastifyInstance,
  cookie: string,
  issuingStateId: string,
  overrides: Partial<{
    licenseNumber: string;
    expirationDate: string;
  }> = {},
) {
  const payload = {
    issuingStateId,
    licenseNumber: overrides.licenseNumber ?? `LIC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    selfReportedStatus: LicenseSelfReportedStatus.ACTIVE,
    issueDate: new Date().toISOString(),
    expirationDate: overrides.expirationDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return app.inject({
    method: 'POST',
    url: '/licenses',
    headers: { cookie },
    payload,
  });
}

async function verifyLicense(app: FastifyInstance, cookie: string, licenseId: string) {
  return app.inject({
    method: 'POST',
    url: '/licenses/verify',
    headers: { cookie },
    payload: {
      licenseId,
      verificationStatus: LicenseVerificationStatus.VERIFIED,
      note: 'ok',
    },
  });
}

async function designateLicense(
  app: FastifyInstance,
  cookie: string,
  licenseId: string,
) {
  return app.inject({
    method: 'POST',
    url: '/licenses/designate',
    headers: { cookie },
    payload: {
      licenseId,
    },
  });
}
