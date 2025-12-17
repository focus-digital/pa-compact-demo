import type { PrismaClient } from "@prisma/client";

import type { QualifyingLicenseDesignationStatusHistory } from "@/domain/types.js";
import type { QualifyingLicenseDesignationStatus } from "@/domain/enums.js";

export type QualifyingLicenseDesignationStatusHistoryCreate = {
  id?: string;
  designationId: string;
  status: QualifyingLicenseDesignationStatus;
  reason?: string | null;
  actorUserId?: string | null;
  createdAt?: Date;
};

export type QualifyingLicenseDesignationStatusHistoryUpdate = Partial<Omit<QualifyingLicenseDesignationStatusHistoryCreate, 'id'>>;

export class QualifyingLicenseDesignationStatusHistoryRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<QualifyingLicenseDesignationStatusHistory | undefined> {
    const row = await this.prisma.qualifyingLicenseDesignationStatusHistory.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return QualifyingLicenseDesignationStatusHistoryRepo.toDomain(row);
  }

  async create(data: QualifyingLicenseDesignationStatusHistoryCreate): Promise<QualifyingLicenseDesignationStatusHistory> {
    const row = await this.prisma.qualifyingLicenseDesignationStatusHistory.create({ data });
    return QualifyingLicenseDesignationStatusHistoryRepo.toDomain(row);
  }

  async update(id: string, data: QualifyingLicenseDesignationStatusHistoryUpdate): Promise<QualifyingLicenseDesignationStatusHistory> {
    const row = await this.prisma.qualifyingLicenseDesignationStatusHistory.update({
      where: { id },
      data,
    });
    return QualifyingLicenseDesignationStatusHistoryRepo.toDomain(row);
  }

  static toDomain(row: any): QualifyingLicenseDesignationStatusHistory {
    return row;
  }
}
