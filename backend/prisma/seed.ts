import { UserRole } from '@/domain/enums.js';
import { AuthService } from '@/service/authService.js';
import { UserService } from '@/service/userService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userService = new UserService(prisma);

const PASSWORD = await AuthService.hashPassword('secret123');

async function main() {
  console.log("seed started");

  userService.ensureUser({ email: 'jdoe@example.com', role: UserRole.USER, passwordHash: PASSWORD })
}

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });