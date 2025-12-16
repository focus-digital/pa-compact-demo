import type { PrismaClient } from "@prisma/client";

import type { LicenseStatusHistory } from "@/domain/types.js";
import type { LicenseVerificationStatus } from "@/domain/enums.js";

export type LicenseStatusHistoryCreate = {
  id?: string;
  licenseId: string;
  verificationStatus: LicenseVerificationStatus;
  note?: string | null;
  actorUserId?: string | null;
  createdAt?: Date;
};

export type LicenseStatusHistoryUpdate = Partial<Omit<LicenseStatusHistoryCreate, 'id'>>;

export class LicenseStatusHistoryRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<LicenseStatusHistory | undefined> {
    const row = await this.prisma.licenseStatusHistory.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return LicenseStatusHistoryRepo.toDomain(row);
  }

  async create(data: LicenseStatusHistoryCreate): Promise<LicenseStatusHistory> {
    const row = await this.prisma.licenseStatusHistory.create({ data });
    return LicenseStatusHistoryRepo.toDomain(row);
  }

  async update(id: string, data: LicenseStatusHistoryUpdate): Promise<LicenseStatusHistory> {
    const row = await this.prisma.licenseStatusHistory.update({
      where: { id },
      data,
    });
    return LicenseStatusHistoryRepo.toDomain(row);
  }

  static toDomain(row: any): LicenseStatusHistory {
    return row;
  }
}
