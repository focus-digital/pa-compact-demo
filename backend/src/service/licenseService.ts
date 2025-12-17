import {
  LicenseVerificationStatus,
  QualifyingLicenseDesignationStatus,
  UserRole,
} from '@/domain/enums.js';
import type { License, QualifyingLicenseDesignation } from '@/domain/types.js';
import { LicenseRepo, type LicenseCreate } from '@/repo/licenseRepo.js';
import {
  LicenseStatusHistoryRepo,
  type LicenseStatusHistoryCreate,
} from '@/repo/licenseStatusHistoryRepo.js';
import {
  QualifyingLicenseDesignationRepo,
  type QualifyingLicenseDesignationCreate,
} from '@/repo/qualifyingLicenseDesignationRepo.js';
import {
  QualifyingLicenseDesignationStatusHistoryRepo,
} from '@/repo/qualifyingLicenseDesignationStatusHistoryRepo.js';
import { PractitionerRepo } from '@/repo/practitionerRepo.js';
import type { PrismaClient } from '@prisma/client';

export type AddLicenseInput = Omit<LicenseCreate, 'id'>;

export type VerifyLicenseInput = {
  licenseId: string;
  verificationStatus: LicenseStatusHistoryCreate['verificationStatus'];
  note?: string | null;
  actorUserId?: string | null;
};

export type DesignateQualifyingLicenseInput = {
  practitionerId: string;
  licenseId: string;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  actorUserId?: string;
};

export type GetLicensesParams = {
  userId: string;
  role: UserRole;
  memberStateId?: string | null;
  status?: LicenseVerificationStatus;
};

export class LicenseService {
  public licenseRepo: LicenseRepo;
  public licenseStatusHistoryRepo: LicenseStatusHistoryRepo;
  public qualifyingLicenseDesignationRepo: QualifyingLicenseDesignationRepo;
  public qualifyingLicenseDesignationStatusHistoryRepo: QualifyingLicenseDesignationStatusHistoryRepo;
  public practitionerRepo: PractitionerRepo;

  constructor(private prisma: PrismaClient) {
    this.licenseRepo = new LicenseRepo(prisma);
    this.licenseStatusHistoryRepo = new LicenseStatusHistoryRepo(prisma);
    this.qualifyingLicenseDesignationRepo = new QualifyingLicenseDesignationRepo(prisma);
    this.qualifyingLicenseDesignationStatusHistoryRepo =
      new QualifyingLicenseDesignationStatusHistoryRepo(prisma);
    this.practitionerRepo = new PractitionerRepo(prisma);
  }

  async addLicense(input: AddLicenseInput): Promise<License> {
    const verificationStatus =
      input.verificationStatus ?? LicenseVerificationStatus.UNVERIFIED;

    const license: LicenseCreate = {
      ...input,
      verificationStatus,
    };

    const created = await this.licenseRepo.create(license);

    await this.licenseStatusHistoryRepo.create({
      licenseId: created.id,
      verificationStatus,
      note: 'Initial creation',
    });

    return created;
  }

  async verifyLicense(input: VerifyLicenseInput): Promise<License> {
    const updated = await this.licenseRepo.update(input.licenseId, {
      verificationStatus: input.verificationStatus,
    });

    await this.licenseStatusHistoryRepo.create({
      licenseId: input.licenseId,
      verificationStatus: input.verificationStatus,
      note: input.note,
      actorUserId: input.actorUserId,
    });

    return updated;
  }
  
  async designateAsQualifyingLicense(
    input: DesignateQualifyingLicenseInput,
  ): Promise<QualifyingLicenseDesignation> {
    await this.archiveActiveDesignation(
      input.practitionerId,
      'Archived before new qualifying license designation',
      input.actorUserId,
    );

    const effectiveFrom = input.effectiveFrom ?? new Date();

    const designation: QualifyingLicenseDesignationCreate = {
      practitionerId: input.practitionerId,
      licenseId: input.licenseId,
      effectiveFrom,
      effectiveTo: input.effectiveTo ?? null,
      status: QualifyingLicenseDesignationStatus.ACTIVE,
    };

    const created = await this.qualifyingLicenseDesignationRepo.create(designation);

    await this.qualifyingLicenseDesignationStatusHistoryRepo.create({
      designationId: created.id,
      status: created.status,
      reason: 'Initial designation',
      actorUserId: input.actorUserId,
    });

    return created;
  }

  async archiveDesignation(
    designationId: string,
    reason?: string,
    actorUserId?: string,
  ): Promise<QualifyingLicenseDesignation> {
    const updated = await this.qualifyingLicenseDesignationRepo.update(designationId, {
      status: QualifyingLicenseDesignationStatus.ARCHIVED,
      effectiveTo: new Date(),
    });

    await this.qualifyingLicenseDesignationStatusHistoryRepo.create({
      designationId: updated.id,
      status: QualifyingLicenseDesignationStatus.ARCHIVED,
      reason,
      actorUserId,
    });

    return updated;
  }

  async archiveActiveDesignation(
    practitionerId: string,
    reason?: string,
    actorUserId?: string,
  ): Promise<void> {
    const existing =
      await this.qualifyingLicenseDesignationRepo.fetchActiveByPractitionerId(practitionerId);
    if (!existing) {
      return;
    }

    await this.archiveDesignation(existing.id, reason, actorUserId);
  }

  async getDesignations(practitionerId: string): Promise<QualifyingLicenseDesignation[]> {
    return this.qualifyingLicenseDesignationRepo.listByPractitionerId(practitionerId);
  }

  async getLicenseById(id: string): Promise<License | undefined> {
    return this.licenseRepo.fetchById(id);
  }

  async getLicenses(params: GetLicensesParams): Promise<License[]> {
    if (params.role === UserRole.PA) {
      const practitioner = await this.practitionerRepo.fetchByUserId(params.userId);
      if (!practitioner) {
        throw new Error('Practitioner not found for user');
      }      
      const list = await this.licenseRepo.list({
        practitionerId: practitioner.id,
        orderByExpiration: 'asc',
      });
      return list;
    }

    if (params.role === UserRole.STATE_ADMIN) {
      if (!params.memberStateId) {
        throw new Error('State admin missing member state');
      }

      return this.licenseRepo.list({
        issuingStateId: params.memberStateId,
        verificationStatus: params.status ?? LicenseVerificationStatus.UNVERIFIED,
        orderByExpiration: 'asc',
      });
    }

    throw new Error('Unauthorized');
  }
}
