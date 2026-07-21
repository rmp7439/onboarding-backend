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

  static async userLogin(loginId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { loginId } });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("User account is inactive");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { id: user.id, loginId: user.loginId, role: "USER",},
      env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        loginId: user.loginId,
        status: user.status,
      },
    };
  }

  // Add to AuthService class
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