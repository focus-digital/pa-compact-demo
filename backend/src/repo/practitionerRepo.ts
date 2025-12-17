import type { PrismaClient } from "@prisma/client";

import type { Practitioner } from "@/domain/types.js";

export type PractitionerCreate = {
  id?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PractitionerUpdate = Partial<Omit<PractitionerCreate, 'id'>>;

export class PractitionerRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<Practitioner | undefined> {
    const row = await this.prisma.practitioner.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return PractitionerRepo.toDomain(row);
  }

  async fetchByUserId(userId: string): Promise<Practitioner | undefined> {
    const row = await this.prisma.practitioner.findUnique({
      where: { userId },
    });

    if (!row) {
      return;
    }

    return PractitionerRepo.toDomain(row);
  }

  async create(data: PractitionerCreate): Promise<Practitioner> {
    const row = await this.prisma.practitioner.create({ data });
    return PractitionerRepo.toDomain(row);
  }

  async update(id: string, data: PractitionerUpdate): Promise<Practitioner> {
    const row = await this.prisma.practitioner.update({
      where: { id },
      data,
    });

    return PractitionerRepo.toDomain(row);
  }

  static toDomain(row: any): Practitioner {
    return row;
  }
}
