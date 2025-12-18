import { useQuery } from '@tanstack/react-query';
import { getMemberStates } from '../api/member-state-api';

export function useMemberStates() {
  return useQuery({
    queryKey: ['member-states'],
    queryFn: getMemberStates,
  });
}
