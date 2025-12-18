import {
  ApplicationStatus,
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  PaymentStatus,
  PrivilegeStatus,
  QualifyingLicenseDesignationStatus,
  UserRole,
} from './enums.js';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  memberStateId: string | null;
  createdAt: Date;
  updatedAt: Date;

  practitioner?: Practitioner;
  memberState?: MemberState | null;
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
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
};

export type License = {
  id: string;
  practitionerId: string;
  issuingStateId: string;
  licenseNumber: string;
  issueDate: Date;
  expirationDate: Date;
  selfReportedStatus: LicenseSelfReportedStatus;
  verificationStatus: LicenseVerificationStatus;
  evidenceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  issuingState: MemberState;
  qualifyingDesignations: QualifyingLicenseDesignation[]
};

export type QualifyingLicenseDesignation = {
  id: string;
  practitionerId: string;
  licenseId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  status: QualifyingLicenseDesignationStatus;
  createdAt: Date;
};

export type QualifyingLicenseDesignationStatusHistory = {
  id: string;
  designationId: string;
  status: QualifyingLicenseDesignationStatus;
  reason: string | null;
  actorUserId: string | null;
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
  practitioner?: Practitioner;
  remoteState?: MemberState;
  qualifyingLicense?: License;
  payment?: PaymentTransaction | null;
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
  practitioner?: Practitioner;
  remoteState?: MemberState;
  application?: PrivilegeApplication;
  qualifyingLicense?: License;
};

export type PrivilegeStatusHistory = {
  id: string;
  privilegeId: string;
  status: PrivilegeStatus;
  reason: string | null;
  actorUserId: string | null;
  createdAt: Date;
};
