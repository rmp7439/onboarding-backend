import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [total, pending, approved, rejected, recent] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'PENDING' } }),
      prisma.employee.count({ where: { status: 'APPROVED' } }),
      prisma.employee.count({ where: { status: 'REJECTED' } }),
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
          joiningDate: true 
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: { total, pending, approved, rejected },
        recentEmployees: recent.map(emp => ({
          id: emp.id,
          code: emp.employeeCode || 'Pending Assignment',
          name: `${emp.firstName} ${emp.surname}`,
          unit: 'N/A',
          phone: emp.mobile,
          status: emp.status,
          joiningDate: emp.joiningDate.toISOString().split('T')[0]
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};