import { prisma } from '../../config/prisma';

export class DashboardService {
  static async getDashboardStats() {
    // Calculate the start of the current day for accurate daily tracking
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Execute queries concurrently for maximum efficiency
    const [
      total,
      pending,
      approved,
      rejected,
      todayRegistrations,
      recentEmployees
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'PENDING' } }),
      prisma.employee.count({ where: { status: 'APPROVED' } }),
      prisma.employee.count({ where: { status: 'REJECTED' } }),
      prisma.employee.count({ where: { uploadedAt: { gte: startOfToday } } }),
      prisma.employee.findMany({
        take: 8,
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          surname: true,
          mobile: true,
          status: true,
          joiningDate: true,
          unit: true // Ensure unit is retrieved
        }
      })
    ]);

    return {
      stats: { total, pending, approved, rejected, todayRegistrations },
      recentEmployees
    };
  }
}