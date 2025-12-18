import type { Privilege, PrivilegeApplication } from '../domain/types';
import { ApplicationStatus } from '../domain/enums';
import { http } from './apiClient';

export type ApplyPrivilegePayload = {
  practitionerId: string;
  remoteStateId: string;
  qualifyingLicenseId: string;
  attestationType: string;
  attestationAccepted: boolean;
  attestationText?: string | null;
  applicantNote?: string | null;
};

export type PayPrivilegePayload = {
  applicationId: string;
  amount: number;
};

export type VerifyPrivilegePayload = {
  applicationId: string;
  status: ApplicationStatus.APPROVED | ApplicationStatus.DENIED;
  expiresAt?: string | null;
};

export async function getPrivileges(): Promise<Privilege[]> {
  const response = await http.get<Privilege[]>('/privileges');
  return response.data;
}

export async function getPrivilegeApplications(): Promise<PrivilegeApplication[]> {
  const response = await http.get<PrivilegeApplication[]>('/privileges/applications');
  return response.data;
}

export async function getPrivilegeReviewApplications(): Promise<PrivilegeApplication[]> {
  const response = await http.get<PrivilegeApplication[]>('/privileges/review');
  return response.data;
}
export async function applyForPrivilege(payload: ApplyPrivilegePayload): Promise<PrivilegeApplication> {
  const response = await http.post<PrivilegeApplication>('/privileges/apply', payload);
  return response.data;
}

export async function payForPrivilege(payload: PayPrivilegePayload): Promise<PrivilegeApplication> {
  const response = await http.post<PrivilegeApplication>('/privileges/pay', payload);
  return response.data;
}

export async function verifyPrivilege(payload: VerifyPrivilegePayload): Promise<{
  application: PrivilegeApplication;
}> {
  const response = await http.post<{ application: PrivilegeApplication }>(
    '/privileges/verify',
    payload,
  );
  return response.data;
}
