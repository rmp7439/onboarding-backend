import { prisma } from "../../config/prisma";

export class BankService {
  static async getBanks(onlyActive?: boolean) {
    const where = onlyActive ? { isActive: true } : {};
    return prisma.bank.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  static async createBank(name: string) {
    const trimmedName = name.trim();
    const existing = await prisma.bank.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } }
    });
    if (existing) throw new Error('Bank name already exists.');

    return prisma.bank.create({
      data: { name: trimmedName }
    });
  }

  static async updateBank(id: string, name: string) {
    const trimmedName = name.trim();
    const bank = await prisma.bank.findUnique({ where: { id } });
    if (!bank) throw new Error('Bank not found.');

    const existing = await prisma.bank.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } }
    });
    if (existing && existing.id !== id) throw new Error('Bank name already exists.');

    return prisma.bank.update({
      where: { id },
      data: { name: trimmedName }
    });
  }

  static async deleteBank(id: string) {
    const bank = await prisma.bank.findUnique({ where: { id } });
    if (!bank) throw new Error('Bank not found.');

    return prisma.bank.delete({
      where: { id }
    });
  }
}