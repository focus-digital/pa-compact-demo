export enum UserRole {
  PA = 'PA',
  STATE_ADMIN = 'STATE_ADMIN',
  COMMISSION_ADMIN = 'COMMISSION_ADMIN',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  NEEDS_INFO = 'NEEDS_INFO',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  ISSUED = 'ISSUED',
}

export enum PrivilegeStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED',
}

export enum LicenseSelfReportedStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  RESTRICTED = 'RESTRICTED',
}

export enum LicenseVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
}

export enum QualifyingLicenseDesignationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum PaymentStatus {
  REQUIRES_PAYMENT = 'REQUIRES_PAYMENT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
