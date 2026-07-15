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

  // Add to AuthService class
  static async employeeLogin(mobile: string, otp: string) {
    // Note: OTP logic is mocked here to match existing setup.
    if (otp !== "123456") {
      throw new Error("Invalid OTP");
    }

    const employee = await prisma.employee.findUnique({ where: { mobile } });

    if (!employee) {
      throw new Error("No employee record found for this mobile number");
    }

    // Future-proofing: Generate JWT for the mobile app
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

  // Utility to seed an initial admin if needed
  static async createInitialAdmin() {
    const exists = await prisma.admin.count();
    if (exists === 0) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await prisma.admin.create({
        data: {
          email: "admin@example.com",
          password: hashedPassword,
          name: "System Admin",
        },
      });
    }
  }
}