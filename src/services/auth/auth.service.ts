import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export class AuthService {
  static async login(username: string, password: string) {
    const admin = await prisma.admin.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    if (!admin.active) {
      throw new Error(
        "Account has been disabled. Please contact the system owner.",
      );
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    };
  }

  static async userLogin(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user || !user.active) {
      throw new Error("Invalid User ID or password.");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid User ID or password.");
    }

    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, role: "SUPERVISOR" }, // Swapped "USER" for "SUPERVISOR"
      env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        mobile: user.mobile,
        active: user.active,
      },
    };
  }

  static async employeeLogin(mobile: string, otp: string) {
    if (otp !== "123456") {
      throw new Error("Invalid OTP");
    }

    const employee = await prisma.employee.findUnique({ where: { mobile } });

    if (!employee) {
      throw new Error("No employee record found for this mobile number");
    }

    const token = jwt.sign(
      { id: employee.id, mobile: employee.mobile, role: "EMPLOYEE" },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      employeeId: employee.id,
      mobile: employee.mobile,
      token,
    };
  }

  static async createInitialAdmin() {
    const adminCount = await prisma.admin.count();

    if (adminCount === 0) {
      // Fresh database: Create the initial DEV owner account
      const password = process.env.DEFAULT_ADMIN_PASSWORD || "ChangeMe123!";
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.admin.create({
        data: {
          username: "dev",
          password: hashedPassword,
          name: "System Admin",
          role: "DEV",
        },
      });
      console.log(
        "[AuthService] Initial DEV account created with username 'dev'.",
      );
    } else {
      // Ensure at least one DEV account exists
      const devCount = await prisma.admin.count({ where: { role: "DEV" } });

      if (devCount === 0) {
        const firstAdmin = await prisma.admin.findFirst({
          orderBy: { createdAt: "asc" },
        });

        if (firstAdmin) {
          await prisma.admin.update({
            where: { id: firstAdmin.id },
            data: { role: "DEV" },
          });
          console.log(`[AuthService] Migrated initial admin to DEV role.`);
        }
      }
    }
  }

  static async changeAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new Error("Admin not found");

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      admin.password,
    );
    if (!isValidPassword) throw new Error("Incorrect current password.");

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedNewPassword },
    });
  }
}
