import { prisma } from '../../config/prisma';

export class BankService {
  static async getBanks(activeOnly: boolean = false) {
    return prisma.bank.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' }
    });
  }

  static async createBank(name: string) {
    const existing = await prisma.bank.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    if (existing) throw new Error('Bank name already exists.');

    return prisma.bank.create({ data: { name } });
  }

  static async updateBank(id: string, name: string, isActive: boolean) {
    const existing = await prisma.bank.findUnique({ where: { id } });
    if (!existing) throw new Error('Bank not found.');

    const existingName = await prisma.bank.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    if (existingName && existingName.id !== id) throw new Error('Bank name already exists.');

    return prisma.bank.update({
      where: { id },
      data: { name, isActive }
    });
  }

  static async deleteBank(id: string) {
    const existing = await prisma.bank.findUnique({ where: { id } });
    if (!existing) throw new Error('Bank not found.');

    return prisma.bank.delete({ where: { id } });
  }
}