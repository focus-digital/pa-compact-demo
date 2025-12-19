import type { PrismaClient } from "@prisma/client";

import type { PrivilegeApplication } from "@/domain/types.js";
import type { ApplicationStatus } from "@/domain/enums.js";

export type PrivilegeApplicationCreate = {
  id?: string;
  practitionerId: string;
  remoteStateId: string;
  qualifyingLicenseId: string;
  status?: ApplicationStatus;
  applicantNote?: string | null;
  reviewerNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PrivilegeApplicationUpdate = Partial<Omit<PrivilegeApplicationCreate, 'id'>>;

export class PrivilegeApplicationRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<PrivilegeApplication | undefined> {
    const row = await this.prisma.privilegeApplication.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return PrivilegeApplicationRepo.toDomain(row);
  }

  async create(data: PrivilegeApplicationCreate): Promise<PrivilegeApplication> {
    const row = await this.prisma.privilegeApplication.create({ data });
    return PrivilegeApplicationRepo.toDomain(row);
  }

  async listByPractitionerId(practitionerId: string): Promise<PrivilegeApplication[]> {
    const rows = await this.prisma.privilegeApplication.findMany({
      where: { practitionerId },
      include: {
        remoteState: true,
        qualifyingLicense: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(PrivilegeApplicationRepo.toDomain);
  }

  async listByRemoteStateId(remoteStateId: string, status?: ApplicationStatus): Promise<PrivilegeApplication[]> {
    const rows = await this.prisma.privilegeApplication.findMany({
      where: {
        remoteStateId,
        ...(status ? { status } : {}),
      },
      include: {
        remoteState: true,
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
        qualifyingLicense: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(PrivilegeApplicationRepo.toDomain);
  }

  async update(id: string, data: PrivilegeApplicationUpdate): Promise<PrivilegeApplication> {
    const row = await this.prisma.privilegeApplication.update({
      where: { id },
      data,
    });
    return PrivilegeApplicationRepo.toDomain(row);
  }

  static toDomain(row: any): PrivilegeApplication {
    return row;
  }
}
