import { UserRole } from '@/domain/enums.js';
import { AuthService } from '@/service/authService.js';
import { PractitionerService } from '@/service/practitionerService.js';
import { UserService } from '@/service/userService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userService = new UserService(prisma);
const practitionerService = new PractitionerService(prisma);
const PASSWORD = await AuthService.hashPassword('secret123');

async function createUsers() {
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

  const stateAdmins = [
    { email: 'ma-admin@example.com', firstName: 'Mara', lastName: 'Adams' },
    { email: 'ny-admin@example.com', firstName: 'Nia', lastName: 'Young' },
    { email: 'ca-admin@example.com', firstName: 'Cam', lastName: 'Anderson' },
  ];

  for (const admin of stateAdmins) {
    await userService.ensureUser({
      ...admin,
      role: UserRole.STATE_ADMIN,
      passwordHash: PASSWORD,
    });
  }
}

async function main() {
  console.log("seed started");
  await createUsers();
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
