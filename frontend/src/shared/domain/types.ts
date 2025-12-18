import type {
  ApplicationStatus,
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  PaymentStatus,
  PrivilegeStatus,
  QualifyingLicenseDesignationStatus,
  UserRole,
} from './enums';

type ISODateString = string;

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  memberStateId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  practitioner?: Practitioner | null;
  memberState?: MemberState | null;
};

export type MemberState = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Practitioner = {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
};

export type License = {
  id: string;
  practitionerId: string;
  issuingStateId: string;
  licenseNumber: string;
  issueDate: ISODateString;
  expirationDate: ISODateString;
  selfReportedStatus: LicenseSelfReportedStatus;
  verificationStatus: LicenseVerificationStatus;
  evidenceUrl: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  issuingState?: MemberState;
  qualifyingDesignations?: QualifyingLicenseDesignation[];
  practitioner?: Practitioner;
};

export type LicenseStatusHistory = {
  id: string;
  licenseId: string;
  verificationStatus: LicenseVerificationStatus;
  note: string | null;
  actorUserId: string | null;
  createdAt: ISODateString;
};

export type QualifyingLicenseDesignation = {
  id: string;
  practitionerId: string;
  licenseId: string;
  effectiveFrom: ISODateString;
  effectiveTo: ISODateString | null;
  status: QualifyingLicenseDesignationStatus;
  createdAt: ISODateString;
};

export type QualifyingLicenseDesignationStatusHistory = {
  id: string;
  designationId: string;
  status: QualifyingLicenseDesignationStatus;
  reason: string | null;
  actorUserId: string | null;
  createdAt: ISODateString;
};

export type PrivilegeApplication = {
  id: string;
  practitionerId: string;
  remoteStateId: string;
  qualifyingLicenseId: string;
  status: ApplicationStatus;
  applicantNote: string | null;
  reviewerNote: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type ApplicationStatusHistory = {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  reason: string | null;
  actorUserId: string | null;
  createdAt: ISODateString;
};

export type Attestation = {
  id: string;
  applicationId: string;
  type: string;
  accepted: boolean;
  acceptedAt: ISODateString | null;
  text: string | null;
};

export type PaymentTransaction = {
  id: string;
  applicationId: string;
  status: PaymentStatus;
  amount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Privilege = {
  id: string;
  practitionerId: string;
  remoteStateId: string;
  applicationId: string;
  qualifyingLicenseId: string;
  status: PrivilegeStatus;
  issuedAt: ISODateString;
  expiresAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type PrivilegeStatusHistory = {
  id: string;
  privilegeId: string;
  status: PrivilegeStatus;
  reason: string | null;
  actorUserId: string | null;
  createdAt: ISODateString;
};
