import type { PrismaClient } from "@prisma/client";

import type { PaymentTransaction } from "@/domain/types.js";
import type { PaymentStatus } from "@/domain/enums.js";

export type PaymentTransactionCreate = {
  id?: string;
  applicationId: string;
  status?: PaymentStatus;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PaymentTransactionUpdate = Partial<Omit<PaymentTransactionCreate, 'id'>>;

export class PaymentTransactionRepo {
  constructor(private prisma: PrismaClient) {}

  async fetchById(id: string): Promise<PaymentTransaction | undefined> {
    const row = await this.prisma.paymentTransaction.findUnique({
      where: { id },
    });

    if (!row) {
      return;
    }

    return PaymentTransactionRepo.toDomain(row);
  }

  async create(data: PaymentTransactionCreate): Promise<PaymentTransaction> {
    const row = await this.prisma.paymentTransaction.create({ data });
    return PaymentTransactionRepo.toDomain(row);
  }

  async update(id: string, data: PaymentTransactionUpdate): Promise<PaymentTransaction> {
    const row = await this.prisma.paymentTransaction.update({
      where: { id },
      data,
    });
    return PaymentTransactionRepo.toDomain(row);
  }

  static toDomain(row: any): PaymentTransaction {
    return row;
  }
}
