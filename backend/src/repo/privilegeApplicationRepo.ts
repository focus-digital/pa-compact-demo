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
