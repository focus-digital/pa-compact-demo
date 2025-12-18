import type { PrismaClient } from '@prisma/client';

import {
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  UserRole,
} from '@/domain/enums.js';
import type { MemberState } from '@/domain/types.js';
import { AuthService } from '@/service/authService.js';
import { UserService } from '@/service/userService.js';
import { PractitionerService } from '@/service/practitionerService.js';
import { LicenseService } from '@/service/licenseService.js';

const DEFAULT_PASSWORD = 'secret123';

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.privilegeStatusHistory.deleteMany(),
    prisma.privilege.deleteMany(),
    prisma.paymentTransaction.deleteMany(),
    prisma.attestation.deleteMany(),
    prisma.applicationStatusHistory.deleteMany(),
    prisma.privilegeApplication.deleteMany(),
    prisma.qualifyingLicenseDesignationStatusHistory.deleteMany(),
    prisma.licenseStatusHistory.deleteMany(),
    prisma.qualifyingLicenseDesignation.deleteMany(),
    prisma.license.deleteMany(),
    prisma.practitioner.deleteMany(),
    prisma.user.deleteMany(),
    prisma.memberState.deleteMany(),
  ]);
}

export async function runDemoSeed(prisma: PrismaClient): Promise<void> {
  const passwordHash = await AuthService.hashPassword(DEFAULT_PASSWORD);
  const userService = new UserService(prisma);
  const practitionerService = new PractitionerService(prisma);
  const licenseService = new LicenseService(prisma);

  const memberStates = await createMemberStates(prisma);
  await createUsers(memberStates, { userService, practitionerService, passwordHash });
  await addAndVerifyLicense(memberStates, { prisma, licenseService });
}

async function createUsers(
  memberStates: MemberState[],
  params: {
    userService: UserService;
    practitionerService: PractitionerService;
    passwordHash: string;
  },
) {
  const practitioners = [
    { email: 'jdoe@example.com', firstName: 'Jane', lastName: 'Doe' },
    { email: 'jsmith@example.com', firstName: 'John', lastName: 'Smith' },
    { email: 'mgarcia@example.com', firstName: 'Maria', lastName: 'Garcia' },
    { email: 'rwilson@example.com', firstName: 'Ryan', lastName: 'Wilson' },
    { email: 'tnguyen@example.com', firstName: 'Tina', lastName: 'Nguyen' },
    { email: 'akhan@example.com', firstName: 'Aisha', lastName: 'Khan' },
    { email: 'bbrown@example.com', firstName: 'Brandon', lastName: 'Brown' },
    { email: 'clopez@example.com', firstName: 'Carlos', lastName: 'Lopez' },
    { email: 'lsmith@example.com', firstName: 'Lena', lastName: 'Smith' },
    { email: 'jkim@example.com', firstName: 'Jin', lastName: 'Kim' },
  ];

  for (const practitioner of practitioners) {
    const user = await params.userService.ensureUser({
      ...practitioner,
      role: UserRole.PA,
      passwordHash: params.passwordHash,
    });

    await params.practitionerService.createPractitioner({
      userId: user.id,
    });
  }

  for (const state of memberStates) {
    await params.userService.ensureUser({
      email: `${state.code.toLowerCase()}-admin@example.com`,
      firstName: state.name,
      lastName: 'Admin',
      role: UserRole.STATE_ADMIN,
      passwordHash: params.passwordHash,
      memberStateId: state.id,
    });
  }
}

async function createMemberStates(prisma: PrismaClient): Promise<MemberState[]> {
  const states = [
    { code: 'AR', name: 'Arkansas' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'ME', name: 'Maine' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'UT', name: 'Utah' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
  ];

  const createdStates: MemberState[] = [];

  for (const state of states) {
    const record = await prisma.memberState.upsert({
      where: { code: state.code },
      update: state,
      create: state,
    });
    createdStates.push(record);
  }

  return createdStates;
}

async function addAndVerifyLicense(
  memberStates: MemberState[],
  params: { prisma: PrismaClient; licenseService: LicenseService },
) {
  const practitioner = await params.prisma.practitioner.findFirst();
  if (!practitioner) {
    return;
  }

  const issuingState = memberStates[0];
  if (!issuingState) {
    return;
  }

  const issuingStateAdmin = await params.prisma.user.findUnique({
    where: { email: `${issuingState.code.toLowerCase()}-admin@example.com` },
  });

  const license = await params.licenseService.addLicense({
    practitionerId: practitioner.id,
    issuingStateId: issuingState.id,
    licenseNumber: `LIC-${issuingState.code}-001`,
    selfReportedStatus: LicenseSelfReportedStatus.ACTIVE,
    issueDate: new Date('2023-01-15'),
    expirationDate: new Date('2026-01-14'),
  });

  await params.licenseService.verifyLicense({
    licenseId: license.id,
    verificationStatus: LicenseVerificationStatus.VERIFIED,
    note: 'Seed verified license',
    actorUserId: issuingStateAdmin?.id,
  });

  await params.licenseService.designateAsQualifyingLicense({
    practitionerId: practitioner.id,
    licenseId: license.id,
    actorUserId: practitioner.userId,
  });
}
