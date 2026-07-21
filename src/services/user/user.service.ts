import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';

export class UserService {
  static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        mobile: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        units: {
          select: {
            unit: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createUser(data: any) {
    const existing = await prisma.user.findUnique({ where: { mobile: data.mobile } });
    if (existing) throw new Error('Mobile number is already registered.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        password: hashedPassword,
        active: data.active !== undefined ? data.active : true
      },
      select: { id: true, name: true, mobile: true, active: true }
    });
  }

  static async updateUser(id: string, data: any) {
    if (data.mobile) {
      const existing = await prisma.user.findUnique({ where: { mobile: data.mobile } });
      if (existing && existing.id !== id) throw new Error('Mobile number is already registered.');
    }

    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, mobile: true, active: true }
    });
  }

  static async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id }
    });
  }

  static async assignUnits(userId: string, unitIds: string[]) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    // Execute deletion of old mappings and insertion of new ones in a single transaction
    await prisma.$transaction([
      prisma.userUnit.deleteMany({
        where: { userId }
      }),
      prisma.userUnit.createMany({
        data: unitIds.map(unitId => ({ userId, unitId }))
      })
    ]);

    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        units: {
          select: { unit: true }
        }
      }
    });
  }
}