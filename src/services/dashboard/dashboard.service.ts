import { prisma } from '../../config/prisma';

export class DashboardService {
  static async getDashboardStats() {
    // Automatically assign missing or test units to 'Development'
    const devUnit = await prisma.unit.findUnique({ where: { name: 'Development' } });
    if (!devUnit) {
      throw new Error("Development Unit not found in the database.");
    }

    await prisma.employee.updateMany({
      where: {
        OR: [
          { unit: null },
          { unit: "" },
          { unit: "N/A" },
          { unit: "Developer" },
          { unit: "Demo Unit A" },
          { unit: "Demo Unit B" }
        ]
      },
      data: {
        unit: devUnit.name
      }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

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