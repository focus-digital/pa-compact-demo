import type { UserRole } from "@/domain/enums.js";
import type { Practitioner, User } from "@/domain/types.js"; 
import type { PrismaClient } from "@prisma/client";

export type UserCreate = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  passwordHash: string;
  memberStateId?: string | null;
}

export class UserRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<User | undefined> {
    const userRow = await this.prisma.user.findUnique({
      where: { id },
      include: { practitioner: true, memberState: true },
    });

    if (!userRow) {
      console.log(`User ${id} not found`);
      return;
    }

    return UserRepo.toDomain(userRow);
  }

  async fetchByEmail(email: string): Promise<User | undefined> {
    const userRow = await this.prisma.user.findUnique({
      where: { email },
      include: { practitioner: true, memberState: true },
    });

    if (!userRow) {
      console.log(`User ${email} not found`);
      return;
    }

    return UserRepo.toDomain(userRow);
  }

  async fetchByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string }> {
    const userRow = await this.prisma.user.findUnique({
      where: { email },
      include: { practitioner: true, memberState: true },
    });

    if (!userRow) {
      throw new Error(`User ${email} not found`);
    }

    return {
      user: UserRepo.toDomain(userRow),
      passwordHash: userRow.passwordHash,
    }
  }

  async create(createPayload: UserCreate): Promise<User> {
    const newRow = await this.prisma.user.create({
      data: {
        ...createPayload,        
      }
    })
    return this.fetchById(newRow.id) as Promise<User>;
  }

  static toDomain(row: any): User {
    const { passwordHash, ...rest } = row;
    return rest;
  }

  async fetchAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      include: { practitioner: true, memberState: true },
    });

    return rows.map(UserRepo.toDomain);
  }
}
