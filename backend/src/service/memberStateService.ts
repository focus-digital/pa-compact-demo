import type { MemberState } from '@/domain/types.js';
import type { PrismaClient } from '@prisma/client';

export class MemberStateService {
  constructor(private prisma: PrismaClient) {}

  async list(includeInactive = false): Promise<MemberState[]> {
    const rows = await this.prisma.memberState.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });

    return rows.map(MemberStateService.toDomain);
  }

  static toDomain(row: any): MemberState {
    return row;
  }
}
