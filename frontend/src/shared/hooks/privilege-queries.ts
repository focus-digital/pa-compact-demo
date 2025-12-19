import { useMutation, useQuery } from '@tanstack/react-query';

import {
  applyForPrivilege,
  getPrivilegeApplications,
  getPrivilegeReviewApplications,
  getPrivileges,
  payForPrivilege,
  searchPrivileges,
  verifyPrivilege,
  type ApplyPrivilegePayload,
  type PayPrivilegePayload,
  type PrivilegeSearchParams,
  type VerifyPrivilegePayload,
} from '../api/privilege-api';
import { queryClient } from './queryClient';

const PRIVILEGES_KEY = ['privileges'];
const APPLICATIONS_KEY = ['privilege-applications'];

type UsePrivilegeQueryOptions = {
  enabled?: boolean;
};

export function usePrivileges(options?: UsePrivilegeQueryOptions) {
  return useQuery({
    queryKey: PRIVILEGES_KEY,
    queryFn: getPrivileges,
    enabled: options?.enabled ?? true,
  });
}

export function usePrivilegeApplications(options?: UsePrivilegeQueryOptions) {
  return useQuery({
    queryKey: APPLICATIONS_KEY,
    queryFn: getPrivilegeApplications,
    enabled: options?.enabled ?? true,
  });
}

export function usePrivilegeReviewApplications(options?: UsePrivilegeQueryOptions) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, 'review'],
    queryFn: getPrivilegeReviewApplications,
    enabled: options?.enabled ?? true,
  });
}

function invalidatePrivilegeData() {
  void queryClient.invalidateQueries({ queryKey: PRIVILEGES_KEY });
  void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
}

export function usePrivilegeSearch(params: PrivilegeSearchParams | null) {
  return useQuery({
    queryKey: ['privilege-search', params],
    queryFn: () => {
      if (!params) {
        throw new Error('Search params required');
      }
      return searchPrivileges(params);
    },
    enabled: Boolean(params?.name),
  });
}

export function useApplyForPrivilege() {
  return useMutation({
    mutationFn: (payload: ApplyPrivilegePayload) => applyForPrivilege(payload),
    onSuccess: () => invalidatePrivilegeData(),
  });
}

export function usePayForPrivilege() {
  return useMutation({
    mutationFn: (payload: PayPrivilegePayload) => payForPrivilege(payload),
    onSuccess: () => invalidatePrivilegeData(),
  });
}

export function useVerifyPrivilege() {
  return useMutation({
    mutationFn: (payload: VerifyPrivilegePayload) => verifyPrivilege(payload),
    onSuccess: () => invalidatePrivilegeData(),
  });
}
