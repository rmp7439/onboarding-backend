import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export class AuthService {
  static async login(email: string, password: string) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    };
  }

  // Utility to seed an initial admin if needed
  static async createInitialAdmin() {
    const exists = await prisma.admin.count();
    if (exists === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.admin.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'System Admin',
        }
      });
    }
  }
}