import {
  ApplicationStatus,
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  PaymentStatus,
  PrivilegeStatus,
  UserRole,
} from './enums.js';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type MemberState = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Practitioner = {
  id: string;
  userId: string;  
  createdAt: Date;
  updatedAt: Date;
};

export type License = {
  id: string;
  practitionerId: string;
  issuingStateId: string;
  licenseNumber: string;
  issueDate: Date | null;
  expirationDate: Date | null;
  selfReportedStatus: LicenseSelfReportedStatus;
  verificationStatus: LicenseVerificationStatus;
  evidenceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type QualifyingLicenseDesignation = {
  id: string;
  practitionerId: string;
  licenseId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
};

export type LicenseStatusHistory = {
  id: string;
  licenseId: string;
  verificationStatus: LicenseVerificationStatus;
  note: string | null;
  actorUserId: string | null;
  createdAt: Date;
};

export type PrivilegeApplication = {
  id: string;
  practitionerId: string;
  remoteStateId: string;
  qualifyingLicenseId: string;
  status: ApplicationStatus;
  applicantNote: string | null;
  reviewerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationStatusHistory = {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  reason: string | null;
  actorUserId: string | null;
  createdAt: Date;
};

export type Attestation = {
  id: string;
  applicationId: string;
  type: string;
  accepted: boolean;
  acceptedAt: Date | null;
  text: string | null;
};

export type PaymentTransaction = {
  id: string;
  applicationId: string;
  status: PaymentStatus;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Privilege = {
  id: string;
  practitionerId: string;
  remoteStateId: string;
  applicationId: string;
  qualifyingLicenseId: string;
  status: PrivilegeStatus;
  issuedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PrivilegeStatusHistory = {
  id: string;
  privilegeId: string;
  status: PrivilegeStatus;
  reason: string | null;
  actorUserId: string | null;
  createdAt: Date;
};
