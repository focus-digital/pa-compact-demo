import type { Practitioner } from '@/domain/types.js';
import { PractitionerRepo, type PractitionerCreate } from '@/repo/practitionerRepo.js';
import type { PrismaClient } from '@prisma/client';

export class PractitionerService {
  public practitionerRepo: PractitionerRepo;

  constructor(private prisma: PrismaClient) {
    this.practitionerRepo = new PractitionerRepo(prisma);
  }

  async createPractitioner(payload: PractitionerCreate): Promise<Practitioner> {
    return this.practitionerRepo.create(payload);
  }
}
