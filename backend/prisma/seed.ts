import { LicenseSelfReportedStatus, LicenseVerificationStatus, UserRole } from '@/domain/enums.js';
import { AuthService } from '@/service/authService.js';
import { LicenseService } from '@/service/licenseService.js';
import { PractitionerService } from '@/service/practitionerService.js';
import { UserService } from '@/service/userService.js';
import { PrismaClient } from '@prisma/client';
import type { MemberState } from '@/domain/types.js';

const prisma = new PrismaClient();
const userService = new UserService(prisma);
const practitionerService = new PractitionerService(prisma);
const licenseService = new LicenseService(prisma);
const PASSWORD = await AuthService.hashPassword('secret123');

async function createUsers(memberStates: MemberState[]) {
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
    const user = await userService.ensureUser({
      ...practitioner,
      role: UserRole.PA,
      passwordHash: PASSWORD,
    });

    await practitionerService.createPractitioner({
      userId: user.id,
    });
  }

  for (const state of memberStates) {
    await userService.ensureUser({
      email: `${state.code.toLowerCase()}-admin@example.com`,
      firstName: state.name,
      lastName: 'Admin',
      role: UserRole.STATE_ADMIN,
      passwordHash: PASSWORD,
      memberStateId: state.id,
    });
  }
}

async function createMemberStates() {
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

async function addAndVerifyLicense(memberStates: MemberState[]) {
  const practitioner = await prisma.practitioner.findFirst();
  if (!practitioner) {
    console.warn('No practitioner found to attach a license');
    return;
  }

  const issuingState = memberStates[0];
  if (!issuingState) {
    console.warn('No member state found to attach a license');
    return;
  }

  const issuingStateAdmin = await prisma.user.findUnique({
    where: { email: `${issuingState.code.toLowerCase()}-admin@example.com` },
  });

  const license = await licenseService.addLicense({
    practitionerId: practitioner.id,
    issuingStateId: issuingState.id,
    licenseNumber: `LIC-${issuingState.code}-001`,
    selfReportedStatus: LicenseSelfReportedStatus.ACTIVE,
    issueDate: new Date('2023-01-15'),
    expirationDate: new Date('2026-01-14'),
  });

  await licenseService.verifyLicense({
    licenseId: license.id,
    verificationStatus: LicenseVerificationStatus.VERIFIED,
    note: 'Seed verified license',
    actorUserId: issuingStateAdmin?.id,
  });

  await licenseService.designateAsQualifyingLicense({
    practitionerId: practitioner.id,
    licenseId: license.id,
    actorUserId: practitioner.userId,
  });
}

async function main() {
  console.log("seed started");
  const memberStates = await createMemberStates();
  await createUsers(memberStates);
  await addAndVerifyLicense(memberStates);
  // userService.ensureUser({ email: 'jdoe@example.com', role: UserRole.PA, passwordHash: PASSWORD })
}

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
