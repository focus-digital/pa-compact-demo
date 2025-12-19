import type { Prisma, PrismaClient } from "@prisma/client";

import type { Practitioner, SearchResult } from "@/domain/types.js";
import { QualifyingLicenseDesignationStatus } from "@/domain/enums.js";
import { PrivilegeRepo } from "./privilegeRepo.js";
import { omit } from "lodash-es";

export type PractitionerCreate = {
  id?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PractitionerUpdate = Partial<Omit<PractitionerCreate, 'id'>>;

export class PractitionerRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<Practitioner | undefined> {
    const row = await this.prisma.practitioner.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return PractitionerRepo.toDomain(row);
  }

  async fetchByUserId(userId: string): Promise<Practitioner | undefined> {
    const row = await this.prisma.practitioner.findUnique({
      where: { userId },
    });

    if (!row) {
      return;
    }

    return PractitionerRepo.toDomain(row);
  }

  async create(data: PractitionerCreate): Promise<Practitioner> {
    const row = await this.prisma.practitioner.create({ data });
    return PractitionerRepo.toDomain(row);
  }

  async update(id: string, data: PractitionerUpdate): Promise<Practitioner> {
    const row = await this.prisma.practitioner.update({
      where: { id },
      data,
    });

    return PractitionerRepo.toDomain(row);
  }

  // TODO remove any fields that we want to filter from public results
  async searchWithQualifyingLicense(params: {
    name: string;
    qualifyingLicenseState?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    const nameFilter = params.name.trim();
    if (!nameFilter) {
      return [];
    }

    const where: Prisma.PractitionerWhereInput = {
      user: {
        OR: [
          { firstName: { contains: nameFilter } },
          { lastName: { contains: nameFilter } },
        ],
      },
      qualifyingLicenseDesignation: {
        some: {
          status: QualifyingLicenseDesignationStatus.ACTIVE,
          ...(params.qualifyingLicenseState
            ? {
                license: {
                  issuingState: {
                    code: { equals: params.qualifyingLicenseState.toUpperCase() },
                  },
                },
              }
            : {}),
        },
      },
    };

    const rows = await this.prisma.practitioner.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        qualifyingLicenseDesignation: {
          where: { status: QualifyingLicenseDesignationStatus.ACTIVE },
          include: {
            license: {
              include: {
                issuingState: true,
              },
            },
          },
          take: 1,
        },
        privileges: {
          include: {
            remoteState: true,
          },
        },
      },
      take: params.limit ?? 25,
      orderBy: {
        user: { firstName: 'asc' },
      },
    });

    return rows
      .map((row) => {
        const designation = row.qualifyingLicenseDesignation?.[0];
        if (!designation) {
          return null;
        }

        const practitioner = PractitionerRepo.toDomain({
          ...row,
        });
        const privileges =
          row.privileges?.map((privilege) => PrivilegeRepo.toDomain(privilege)) ?? [];

        return {
          practitioner: omit(practitioner, ['qualifyingLicenseDesignation', 'privileges']),
          qualifyingLicense: designation.license,
          privileges,
        };
      })
      .filter((result): result is SearchResult => Boolean(result));
  }

  static toDomain(row: any): Practitioner {
    return row;
  }
}
