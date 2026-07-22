import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export class AuthService {
  static async login(email: string, password: string) {
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
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
      { id: user.id, mobile: user.mobile, role: "USER" },
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
    const exists = await prisma.admin.count();
    if (exists === 0) {
      // Secure fallback using environment variables
      const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@company.com";
      const password = process.env.DEFAULT_ADMIN_PASSWORD || "ChangeMe123!";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.admin.create({
        data: {
          email,
          password: hashedPassword,
          name: "System Admin",
        },
      });
    }
  }

  static async changeAdminPassword(adminId: string, currentPassword: string, newPassword: string) {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new Error("Admin not found");

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) throw new Error("Incorrect current password.");

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedNewPassword }
    });
  }
}