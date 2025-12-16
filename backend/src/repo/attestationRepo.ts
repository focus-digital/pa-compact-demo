import type { PrismaClient } from "@prisma/client";

import type { Attestation } from "@/domain/types.js";

export type AttestationCreate = {
  id?: string;
  applicationId: string;
  type: string;
  accepted?: boolean;
  acceptedAt?: Date | null;
  text?: string | null;
};

export type AttestationUpdate = Partial<Omit<AttestationCreate, 'id'>>;

export class AttestationRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<Attestation | undefined> {
    const row = await this.prisma.attestation.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return AttestationRepo.toDomain(row);
  }

  async create(data: AttestationCreate): Promise<Attestation> {
    const row = await this.prisma.attestation.create({ data });
    return AttestationRepo.toDomain(row);
  }

  async update(id: string, data: AttestationUpdate): Promise<Attestation> {
    const row = await this.prisma.attestation.update({
      where: { id },
      data,
    });
    return AttestationRepo.toDomain(row);
  }

  static toDomain(row: any): Attestation {
    return row;
  }
}
