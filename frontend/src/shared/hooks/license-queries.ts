import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createLicense,
  designateLicense,
  getLicenses,
  verifyLicense,
  type DesignateLicensePayload,
  type LicenseCreatePayload,
  type VerifyLicensePayload,
} from '../api/license-api';
import type { LicenseVerificationStatus } from '../domain/enums';
import type { License } from '../domain/types';
import { queryClient } from './queryClient';

const LICENSES_QUERY_KEY = ['licenses'];

type UseLicensesOptions = {
  enabled?: boolean;
};

export function useLicenses(
  status?: LicenseVerificationStatus,
  options?: UseLicensesOptions,
) {
  return useQuery({
    queryKey: status ? [...LICENSES_QUERY_KEY, { status }] : LICENSES_QUERY_KEY,
    queryFn: () => getLicenses(status),
    enabled: options?.enabled ?? true,
  });
}

function invalidateLicenses() {
  void queryClient.invalidateQueries({ queryKey: LICENSES_QUERY_KEY });
}

export function useAddLicense() {
  return useMutation({
    mutationFn: (payload: LicenseCreatePayload) => createLicense(payload),
    onSuccess: () => invalidateLicenses(),
  });
}

export function useVerifyLicense() {
  return useMutation({
    mutationFn: (payload: VerifyLicensePayload) => verifyLicense(payload),
    onSuccess: () => invalidateLicenses(),
  });
}

export function useDesignateLicense() {
  return useMutation({
    mutationFn: (payload: DesignateLicensePayload) => designateLicense(payload),
    onSuccess: () => invalidateLicenses(),
  });
}
