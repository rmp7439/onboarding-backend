import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";

export class AdminService {
  static async getAdmins() {
    return prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async createAdmin(data: { name: string; email: string; password: string }) {
    const existing = await prisma.admin.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("An Admin with this email already exists.");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.admin.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "ADMIN", // Strictly forced, cannot be passed in via API
        active: true,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  }

  static async updateAdmin(id: string, data: { name?: string; email?: string; active?: boolean }) {
    const targetAdmin = await prisma.admin.findUnique({ where: { id } });
    if (!targetAdmin) throw new Error("Admin not found.");

    // DEV Protection: No one (not even themselves through this generic endpoint) can disable/modify the DEV account
    if (targetAdmin.role === "PERME") {
      throw new Error("The DEV/Owner account is protected and cannot be modified.");
    }

    if (data.email) {
      const existing = await prisma.admin.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) throw new Error("Email is already in use.");
    }

    return prisma.admin.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  }

  static async resetAdminPassword(id: string, newPassword: string) {
    const targetAdmin = await prisma.admin.findUnique({ where: { id } });
    if (!targetAdmin) throw new Error("Admin not found.");

    if (targetAdmin.role === "PERME") {
      throw new Error("The DEV/Owner account password cannot be reset via this endpoint.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  static async deleteAdmin(id: string) {
    const targetAdmin = await prisma.admin.findUnique({ where: { id } });
    if (!targetAdmin) throw new Error("Admin not found.");

    if (targetAdmin.role === "PERME") {
      throw new Error("The DEV/Owner account is protected and cannot be deleted.");
    }

    return prisma.admin.delete({ where: { id } });
  }
}