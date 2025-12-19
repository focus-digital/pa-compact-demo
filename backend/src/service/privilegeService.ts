import {
  ApplicationStatus,
  PaymentStatus,
  PrivilegeStatus,
} from '@/domain/enums.js';
import type {
  Privilege,
  PrivilegeApplication,
  SearchResult,
} from '@/domain/types.js';
import {
  PrivilegeApplicationRepo,
  type PrivilegeApplicationCreate,
} from '@/repo/privilegeApplicationRepo.js';
import {
  ApplicationStatusHistoryRepo,
} from '@/repo/applicationStatusHistoryRepo.js';
import { AttestationRepo } from '@/repo/attestationRepo.js';
import {
  PaymentTransactionRepo,
  type PaymentTransactionCreate,
} from '@/repo/paymentTransactionRepo.js';
import {
  PrivilegeRepo,
  type PrivilegeCreate,
} from '@/repo/privilegeRepo.js';
import {
  PrivilegeStatusHistoryRepo,
} from '@/repo/privilegeStatusHistoryRepo.js';
import { PractitionerRepo } from '@/repo/practitionerRepo.js';
import type { Practitioner } from '@/domain/types.js';
import type { PrismaClient } from '@prisma/client';

export type ApplyPrivilegeInput = {
  practitionerId: string;
  remoteStateId: string;
  qualifyingLicenseId: string;
  attestationType: string;
  attestationAccepted: boolean;
  attestationText?: string;
  applicantNote?: string | null;
};

export type PayApplicationInput = {
  applicationId: string;
  amount: number;
};

export type VerifyApplicationInput = {
  applicationId: string;
  status: ApplicationStatus.APPROVED | ApplicationStatus.DENIED;
  expiresAt?: Date | null;
};

export type PrivilegeSearchInput = {
  name: string;
  qualifyingLicenseState?: string;
};

export class PrivilegeService {
  public privilegeApplicationRepo: PrivilegeApplicationRepo;
  public applicationStatusHistoryRepo: ApplicationStatusHistoryRepo;
  public attestationRepo: AttestationRepo;
  public paymentTransactionRepo: PaymentTransactionRepo;
  public privilegeRepo: PrivilegeRepo;
  public privilegeStatusHistoryRepo: PrivilegeStatusHistoryRepo;
  public practitionerRepo: PractitionerRepo;

  constructor(private prisma: PrismaClient) {
    this.privilegeApplicationRepo = new PrivilegeApplicationRepo(prisma);
    this.applicationStatusHistoryRepo = new ApplicationStatusHistoryRepo(prisma);
    this.attestationRepo = new AttestationRepo(prisma);
    this.paymentTransactionRepo = new PaymentTransactionRepo(prisma);
    this.privilegeRepo = new PrivilegeRepo(prisma);
    this.privilegeStatusHistoryRepo = new PrivilegeStatusHistoryRepo(prisma);
    this.practitionerRepo = new PractitionerRepo(prisma);
  }

  async apply(input: ApplyPrivilegeInput): Promise<PrivilegeApplication> {
    const applicationPayload: PrivilegeApplicationCreate = {
      practitionerId: input.practitionerId,
      remoteStateId: input.remoteStateId,
      qualifyingLicenseId: input.qualifyingLicenseId,
      status: ApplicationStatus.SUBMITTED,
      applicantNote: input.applicantNote ?? null,
    };

    const application = await this.privilegeApplicationRepo.create(applicationPayload);

    await this.attestationRepo.create({
      applicationId: application.id,
      type: input.attestationType,
      accepted: input.attestationAccepted,
      acceptedAt: input.attestationAccepted ? new Date() : null,
      text: input.attestationText ?? null,
    });

    await this.applicationStatusHistoryRepo.create({
      applicationId: application.id,
      status: ApplicationStatus.SUBMITTED,
      reason: 'Application submitted',
    });

    return application;
  }

  async recordPayment(input: PayApplicationInput): Promise<PrivilegeApplication> {
    const application = await this.ensureApplication(input.applicationId);

    const existingPayment = await this.paymentTransactionRepo.fetchByApplicationId(
      input.applicationId,
    );

    if (existingPayment) {
      await this.paymentTransactionRepo.update(existingPayment.id, {
        amount: input.amount,
        status: PaymentStatus.PAID,
      });
    } else {
      const paymentPayload: PaymentTransactionCreate = {
        applicationId: input.applicationId,
        amount: input.amount,
        status: PaymentStatus.PAID,
      };
      await this.paymentTransactionRepo.create(paymentPayload);
    }

    const updatedApplication = await this.privilegeApplicationRepo.update(application.id, {
      status: ApplicationStatus.UNDER_REVIEW,
    });

    await this.applicationStatusHistoryRepo.create({
      applicationId: application.id,
      status: ApplicationStatus.UNDER_REVIEW,
      reason: 'Payment received',
    });

    return updatedApplication;
  }

  async determineApplication(
    input: VerifyApplicationInput,
  ): Promise<{ application: PrivilegeApplication; privilege?: Privilege }> {
    if (![ApplicationStatus.APPROVED, ApplicationStatus.DENIED].includes(input.status)) {
      throw new Error('Invalid determination status');
    }

    const application = await this.ensureApplication(input.applicationId);

    const updatedApplication = await this.privilegeApplicationRepo.update(application.id, {
      status: input.status,
    });

    await this.applicationStatusHistoryRepo.create({
      applicationId: application.id,
      status: input.status,
      reason: 'Application reviewed',
    });

    if (input.status === ApplicationStatus.DENIED) {
      return { application: updatedApplication };
    }

    const privilegePayload: PrivilegeCreate = {
      practitionerId: application.practitionerId,
      remoteStateId: application.remoteStateId,
      applicationId: application.id,
      qualifyingLicenseId: application.qualifyingLicenseId,
      status: PrivilegeStatus.ACTIVE,
      issuedAt: new Date(),
      expiresAt: input.expiresAt ?? null,
    };

    const privilege = await this.privilegeRepo.create(privilegePayload);

    await this.privilegeStatusHistoryRepo.create({
      privilegeId: privilege.id,
      status: PrivilegeStatus.ACTIVE,
      reason: 'Privilege issued',
    });

    return { application: updatedApplication, privilege };
  }

  async listPrivilegesForUser(userId: string) {
    const practitioner = await this.ensurePractitionerForUser(userId);
    return this.privilegeRepo.listByPractitionerId(practitioner.id);
  }

  async listApplicationsForUser(userId: string) {
    const practitioner = await this.ensurePractitionerForUser(userId);
    return this.privilegeApplicationRepo.listByPractitionerId(practitioner.id);
  }

  async listApplicationsForState(memberStateId: string, status?: ApplicationStatus) {
    return this.privilegeApplicationRepo.listByRemoteStateId(memberStateId, status);
  }

  async searchPractitioners(
    input: PrivilegeSearchInput,
  ): Promise<SearchResult[]> {
    // TODO remove any fields that we want to filter from public results
    return this.practitionerRepo.searchWithQualifyingLicense(input);
  }

  private async ensureApplication(id: string): Promise<PrivilegeApplication> {
    const application = await this.privilegeApplicationRepo.fetchById(id);
    if (!application) {
      throw new Error(`Application ${id} not found`);
    }
    return application;
  }

  private async ensurePractitionerForUser(userId: string): Promise<Practitioner> {
    const practitioner = await this.practitionerRepo.fetchByUserId(userId);
    if (!practitioner) {
      throw new Error('Practitioner not found for user');
    }
    return practitioner;
  }
}
