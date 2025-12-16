import type { PrismaClient } from "@prisma/client";

import type { Privilege } from "@/domain/types.js";
import type { PrivilegeStatus } from "@/domain/enums.js";

export type PrivilegeCreate = {
  id?: string;
  practitionerId: string;
  remoteStateId: string;
  applicationId: string;
  qualifyingLicenseId: string;
  status?: PrivilegeStatus;
  issuedAt?: Date;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PrivilegeUpdate = Partial<Omit<PrivilegeCreate, 'id'>>;

export class PrivilegeRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<Privilege | undefined> {
    const row = await this.prisma.privilege.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return PrivilegeRepo.toDomain(row);
  }

  async create(data: PrivilegeCreate): Promise<Privilege> {
    const row = await this.prisma.privilege.create({ data });
    return PrivilegeRepo.toDomain(row);
  }

  async update(id: string, data: PrivilegeUpdate): Promise<Privilege> {
    const row = await this.prisma.privilege.update({
      where: { id },
      data,
    });
    return PrivilegeRepo.toDomain(row);
  }

  static toDomain(row: any): Privilege {
    return row;
  }
}
