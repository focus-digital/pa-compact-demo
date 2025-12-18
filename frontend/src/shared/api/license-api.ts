import { http } from './apiClient';
import type { License, QualifyingLicenseDesignation } from '../domain/types';
import type { LicenseVerificationStatus, LicenseSelfReportedStatus } from '../domain/enums';

export type LicenseCreatePayload = {
  issuingStateId: string;
  licenseNumber: string;
  selfReportedStatus: LicenseSelfReportedStatus;
  issueDate: string;
  expirationDate: string;
  evidenceUrl?: string | null;
};

export type VerifyLicensePayload = {
  licenseId: string;
  verificationStatus?: LicenseVerificationStatus;
  note?: string;
};

export type DesignateLicensePayload = {
  licenseId: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

export async function getLicenses(
  status?: LicenseVerificationStatus,
): Promise<License[]> {
  const response = await http.get<License[]>('/licenses', {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function createLicense(payload: LicenseCreatePayload): Promise<License> {
  const response = await http.post<License>('/licenses', payload);
  return response.data;
}

export async function verifyLicense(payload: VerifyLicensePayload): Promise<License> {
  const response = await http.post<License>('/licenses/verify', payload);
  return response.data;
}

export async function designateLicense(
  payload: DesignateLicensePayload,
): Promise<QualifyingLicenseDesignation> {
  const response = await http.post<QualifyingLicenseDesignation>('/licenses/designate', payload);
  return response.data;
}
