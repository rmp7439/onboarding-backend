import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";

export class UserService {
  static async createUser(data: {
    name: string;
    loginId: string;
    password: string;
    status?: UserStatus;
    units: string[];
  }) {
    const existing = await prisma.user.findUnique({
      where: { loginId: data.loginId },
    });

    if (existing) {
      throw new Error("Login ID must be unique");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        loginId: data.loginId,
        password: hashedPassword,
        status: data.status || UserStatus.ACTIVE,
        units: data.units,
      },
    });

    return {
      id: user.id,
      name: user.name,
      loginId: user.loginId,
      status: user.status,
      units: user.units,
    };
  }
}