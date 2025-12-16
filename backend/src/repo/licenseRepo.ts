import type { PrismaClient } from "@prisma/client";

import type { License } from "@/domain/types.js";
import type { LicenseSelfReportedStatus, LicenseVerificationStatus } from "@/domain/enums.js";

export type LicenseCreate = {
  id?: string;
  practitionerId: string;
  issuingStateId: string;
  licenseNumber: string;
  issueDate?: Date | null;
  expirationDate?: Date | null;
  selfReportedStatus: LicenseSelfReportedStatus;
  verificationStatus?: LicenseVerificationStatus;
  evidenceUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type LicenseUpdate = Partial<Omit<LicenseCreate, 'id'>>;

export class LicenseRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<License | undefined> {
    const row = await this.prisma.license.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return LicenseRepo.toDomain(row);
  }

  async create(data: LicenseCreate): Promise<License> {
    const row = await this.prisma.license.create({ data });
    return LicenseRepo.toDomain(row);
  }

  async update(id: string, data: LicenseUpdate): Promise<License> {
    const row = await this.prisma.license.update({
      where: { id },
      data,
    });
    return LicenseRepo.toDomain(row);
  }

  static toDomain(row: any): License {
    return row;
  }
}
