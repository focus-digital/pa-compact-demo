import type { PrismaClient } from "@prisma/client";

import type { PrivilegeStatusHistory } from "@/domain/types.js";
import type { PrivilegeStatus } from "@/domain/enums.js";

export type PrivilegeStatusHistoryCreate = {
  id?: string;
  privilegeId: string;
  status: PrivilegeStatus;
  reason?: string | null;
  actorUserId?: string | null;
  createdAt?: Date;
};

export type PrivilegeStatusHistoryUpdate = Partial<Omit<PrivilegeStatusHistoryCreate, 'id'>>;

export class PrivilegeStatusHistoryRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<PrivilegeStatusHistory | undefined> {
    const row = await this.prisma.privilegeStatusHistory.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return PrivilegeStatusHistoryRepo.toDomain(row);
  }

  async create(data: PrivilegeStatusHistoryCreate): Promise<PrivilegeStatusHistory> {
    const row = await this.prisma.privilegeStatusHistory.create({ data });
    return PrivilegeStatusHistoryRepo.toDomain(row);
  }

  async update(id: string, data: PrivilegeStatusHistoryUpdate): Promise<PrivilegeStatusHistory> {
    const row = await this.prisma.privilegeStatusHistory.update({
      where: { id },
      data,
    });
    return PrivilegeStatusHistoryRepo.toDomain(row);
  }

  static toDomain(row: any): PrivilegeStatusHistory {
    return row;
  }
}
