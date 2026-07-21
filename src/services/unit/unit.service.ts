import { prisma } from '../../config/prisma';

export class UnitService {
  static async getUnits() {
    return prisma.unit.findMany({
      orderBy: { name: 'asc' }
    });
  }

  static async createUnit(name: string) {
    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing) throw new Error('Unit name already exists.');

    return prisma.unit.create({
      data: { name }
    });
  }

  static async updateUnit(id: string, name: string) {
    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing && existing.id !== id) throw new Error('Unit name already exists.');

    return prisma.unit.update({
      where: { id },
      data: { name }
    });
  }

  static async deleteUnit(id: string) {
    return prisma.unit.delete({
      where: { id }
    });
  }
}