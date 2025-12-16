import type { PrismaClient } from "@prisma/client";

import type { ApplicationStatusHistory } from "@/domain/types.js";
import type { ApplicationStatus } from "@/domain/enums.js";

export type ApplicationStatusHistoryCreate = {
  id?: string;
  applicationId: string;
  status: ApplicationStatus;
  reason?: string | null;
  actorUserId?: string | null;
  createdAt?: Date;
};

export type ApplicationStatusHistoryUpdate = Partial<Omit<ApplicationStatusHistoryCreate, 'id'>>;

export class ApplicationStatusHistoryRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<ApplicationStatusHistory | undefined> {
    const row = await this.prisma.applicationStatusHistory.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return ApplicationStatusHistoryRepo.toDomain(row);
  }

  async create(data: ApplicationStatusHistoryCreate): Promise<ApplicationStatusHistory> {
    const row = await this.prisma.applicationStatusHistory.create({ data });
    return ApplicationStatusHistoryRepo.toDomain(row);
  }

  async update(id: string, data: ApplicationStatusHistoryUpdate): Promise<ApplicationStatusHistory> {
    const row = await this.prisma.applicationStatusHistory.update({
      where: { id },
      data,
    });
    return ApplicationStatusHistoryRepo.toDomain(row);
  }

  static toDomain(row: any): ApplicationStatusHistory {
    return row;
  }
}
