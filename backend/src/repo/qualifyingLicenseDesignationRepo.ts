import type { PrismaClient } from "@prisma/client";

import type { QualifyingLicenseDesignation } from "@/domain/types.js";
import { QualifyingLicenseDesignationStatus } from "@/domain/enums.js";

export type QualifyingLicenseDesignationCreate = {
  id?: string;
  practitionerId: string;
  licenseId: string;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  status?: QualifyingLicenseDesignationStatus;
  createdAt?: Date;
};

export type QualifyingLicenseDesignationUpdate = Partial<Omit<QualifyingLicenseDesignationCreate, 'id'>>;

export class QualifyingLicenseDesignationRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<QualifyingLicenseDesignation | undefined> {
    const row = await this.prisma.qualifyingLicenseDesignation.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return QualifyingLicenseDesignationRepo.toDomain(row);
  }

  async listByPractitionerId(practitionerId: string): Promise<QualifyingLicenseDesignation[]> {
    const rows = await this.prisma.qualifyingLicenseDesignation.findMany({
      where: { practitionerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!rows) {
      return []
    }

    return rows.map(QualifyingLicenseDesignationRepo.toDomain);
  }

  async create(data: QualifyingLicenseDesignationCreate): Promise<QualifyingLicenseDesignation> {
    const row = await this.prisma.qualifyingLicenseDesignation.create({ data });
    return QualifyingLicenseDesignationRepo.toDomain(row);
  }

  async update(id: string, data: QualifyingLicenseDesignationUpdate): Promise<QualifyingLicenseDesignation> {
    const row = await this.prisma.qualifyingLicenseDesignation.update({
      where: { id },
      data,
    });
    return QualifyingLicenseDesignationRepo.toDomain(row);
  }

  async fetchActiveByPractitionerId(practitionerId: string): Promise<QualifyingLicenseDesignation | undefined> {
    const row = await this.prisma.qualifyingLicenseDesignation.findFirst({
      where: { practitionerId, status: QualifyingLicenseDesignationStatus.ACTIVE },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!row) {
      return;
    }

    return QualifyingLicenseDesignationRepo.toDomain(row);
  }

  static toDomain(row: any): QualifyingLicenseDesignation {
    return row;
  }
}
