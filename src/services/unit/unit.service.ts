import { prisma } from '../../config/prisma';

export class UnitService {
  static async getUnits() {
    return prisma.unit.findMany({
      orderBy: { name: 'asc' }
    });
  }

  static async createUnit(name: string, requiredFields: string[] = []) {
    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing) throw new Error('Unit name already exists.');

    return prisma.unit.create({
      data: { name, requiredFields }
    });
  }

  static async updateUnit(id: string, name: string, requiredFields: string[] = []) {
    const existing = await prisma.unit.findUnique({ where: { id } });
    if (!existing) throw new Error('Unit not found.');
    
    // Security: Prevent renaming of protected system units, but allow updating requiredFields
    if (existing.isProtected && existing.name !== name) {
      throw new Error('This protected system unit cannot be renamed.');
    }

    const existingName = await prisma.unit.findUnique({ where: { name } });
    if (existingName && existingName.id !== id) throw new Error('Unit name already exists.');

    return prisma.unit.update({
      where: { id },
      data: { name, requiredFields }
    });
  }

  static async deleteUnit(id: string) {
    const existing = await prisma.unit.findUnique({ where: { id } });
    if (!existing) throw new Error('Unit not found.');
    
    // Security: Prevent deletion of protected system units
    if (existing.isProtected) {
      throw new Error('This is a protected system unit and cannot be deleted.');
    }

    return prisma.unit.delete({
      where: { id }
    });
  }
}