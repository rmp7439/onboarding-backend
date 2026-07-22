import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';

export class UserService {
  static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        userId: true,
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

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }, // Note: This userId variable refers to the CUID primary key from the JWT token
      include: { units: { include: { unit: true } } }
    });

    if (!user) throw new Error('User not found.');

    return {
      id: user.id,
      userId: user.userId, // Added
      name: user.name,
      mobile: user.mobile,
      role: 'USER',
      units: user.units.map(u => ({ id: u.unit.id, name: u.unit.name }))
    };
  }

  static async checkUserHasUnitByName(userId: string, unitName: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { units: { include: { unit: true } } }
    });
    if (!user) return false;
    return user.units.some(u => u.unit.name === unitName);
  }

  static async createUser(data: any) {
    // Validate uniqueness of mobile
    const existingMobile = await prisma.user.findUnique({ where: { mobile: data.mobile } });
    if (existingMobile) throw new Error('Mobile number is already registered.');

    // Validate uniqueness of new userId
    const existingUserId = await prisma.user.findUnique({ where: { userId: data.userId } });
    if (existingUserId) throw new Error('User ID is already registered.');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        userId: data.userId, // Added
        name: data.name,
        mobile: data.mobile,
        password: hashedPassword,
        active: data.active !== undefined ? data.active : true
      },
      select: { id: true, userId: true, name: true, mobile: true, active: true } // Added userId
    });
  }

  static async updateUser(id: string, data: any) {
    if (data.mobile) {
      const existing = await prisma.user.findUnique({ where: { mobile: data.mobile } });
      if (existing && existing.id !== id) throw new Error('Mobile number is already registered.');
    }
    
    if (data.userId) {
      const existing = await prisma.user.findUnique({ where: { userId: data.userId } });
      if (existing && existing.id !== id) throw new Error('User ID is already registered.');
    }

    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, userId: true, name: true, mobile: true, active: true } // Added userId
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