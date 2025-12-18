import { QualifyingLicenseDesignationStatus, type PrismaClient } from "@prisma/client";

import type { License } from "@/domain/types.js";
import type { LicenseSelfReportedStatus, LicenseVerificationStatus } from "@/domain/enums.js";

export type LicenseCreate = {
  id?: string;
  practitionerId: string;
  issuingStateId: string;
  licenseNumber: string;
  issueDate: Date;
  expirationDate: Date;
  selfReportedStatus: LicenseSelfReportedStatus;
  verificationStatus?: LicenseVerificationStatus;
  evidenceUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type LicenseUpdate = Partial<Omit<LicenseCreate, 'id'>>;

export type LicenseListFilters = {
  practitionerId?: string;
  issuingStateId?: string;
  verificationStatus?: LicenseVerificationStatus;
  orderByExpiration?: 'asc' | 'desc';
};

export class LicenseRepo {
  constructor(private prisma: PrismaClient) {}

  private baseInclude = {
    issuingState: true,
    qualifyingDesignations: {
      where: {
        status: QualifyingLicenseDesignationStatus.ACTIVE
      }
    },
    practitioner: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  } as const;

  async fetchById(id: string): Promise<License | undefined> {
    const row = await this.prisma.license.findUnique({
      where: { id },
      include: this.baseInclude,
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

  async list(filters: LicenseListFilters): Promise<License[]> {
    const rows = await this.prisma.license.findMany({
      where: {
        practitionerId: filters.practitionerId,
        issuingStateId: filters.issuingStateId,
        verificationStatus: filters.verificationStatus,
      },
      include: this.baseInclude,
      orderBy: filters.orderByExpiration
        ? { expirationDate: filters.orderByExpiration }
        : undefined,
    });

    return rows.map(LicenseRepo.toDomain);
  }

  static toDomain(row: any): License {
    return row;
  }
}
