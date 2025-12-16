import type { PrismaClient } from "@prisma/client";

import type { MemberState } from "@/domain/types.js";

export type MemberStateCreate = {
  id?: string;
  code: string;
  name: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MemberStateUpdate = Partial<Omit<MemberStateCreate, 'id'>>;

export class MemberStateRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<MemberState | undefined> {
    const row = await this.prisma.memberState.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return MemberStateRepo.toDomain(row);
  }

  async create(data: MemberStateCreate): Promise<MemberState> {
    const row = await this.prisma.memberState.create({ data });
    return MemberStateRepo.toDomain(row);
  }

  async update(id: string, data: MemberStateUpdate): Promise<MemberState> {
    const row = await this.prisma.memberState.update({
      where: { id },
      data,
    });
    return MemberStateRepo.toDomain(row);
  }

  static toDomain(row: any): MemberState {
    return row;
  }
}
