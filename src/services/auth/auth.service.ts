import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export class AuthService {
  // Admin login remains exactly the same
  static async login(email: string, password: string) { ... }

  // Field Manager login updated to userId
  static async userLogin(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { userId } });

    // Reject if user doesn't exist
    if (!user) {
      throw new Error("Invalid User ID or password.");
    }

    // Reject if user is inactive
    if (!user.active) {
      throw new Error("Invalid User ID or password.");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid User ID or password.");
    }

    // Issue JWT - payload unchanged
    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, role: "USER" },
      env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return {
      token,
      user: {
        id: user.id,
        userId: user.userId, // Return the new userId
        name: user.name,
        mobile: user.mobile,
        active: user.active,
      },
    };
  }

  // Employee login remains exactly the same (mobile + OTP)
  static async employeeLogin(mobile: string, otp: string) { ... }
  
  static async createInitialAdmin() { ... }
}