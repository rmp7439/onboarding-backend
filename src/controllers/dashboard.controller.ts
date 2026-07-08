import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard/dashboard.service";

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await DashboardService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: {
        stats: data.stats,
        recentEmployees: data.recentEmployees.map((emp) => ({
          id: emp.id,
          code: emp.employeeCode || 'Pending Assignment',
          name: `${emp.firstName} ${emp.surname}`,
          unit: 'N/A', // Placeholder: Unit tracking logic can be wired here if added to schema
          phone: emp.mobile,
          status: emp.status,
          joiningDate: emp.joiningDate.toISOString().split('T')[0]
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch dashboard statistics." });
  }
};