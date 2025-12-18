import type { MemberState } from '../domain/types';
import { http } from './apiClient';

export async function getMemberStates(): Promise<MemberState[]> {
  const response = await http.get<MemberState[]>('/states');
  return response.data;
}
