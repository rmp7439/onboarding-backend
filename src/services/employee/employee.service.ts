import { prisma } from '../../config/prisma';
import { Employee, EmployeeStatus, Prisma } from '@prisma/client';

type EmployeeWithRejectReason = Employee & {
  rejectReason?: string | null;
};

export class EmployeeService {
  static async registerEmployee(data: Prisma.EmployeeCreateInput): Promise<Employee> {
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [{ mobile: data.mobile }, { aadhaar: data.aadhaar }, { pan: data.pan }]
      }
    });

    if (existingEmployee) {
      if (existingEmployee.mobile === data.mobile) throw new Error('Mobile number already registered.');
      if (existingEmployee.aadhaar === data.aadhaar) throw new Error('Aadhaar already registered.');
      if (existingEmployee.pan === data.pan) throw new Error('PAN already registered.');
    }

    const dateOfBirth = new Date(data.dateOfBirth);
    const joiningDate = new Date(data.joiningDate);

    return prisma.employee.create({
      data: {
        ...data,
        dateOfBirth,
        joiningDate,
        status: EmployeeStatus.PENDING,
        employeeCode: null,
      }
    });
  }

  static async getEmployeeProfile(id: string) {
  const employee = await this.getEmployeeById(id);

  return employee;
}

  static async returnForCorrection(id: string, remark: string): Promise<Employee> {
    await this.getEmployeeById(id);
    return prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.RETURNED_FOR_CORRECTION,
        correctionRemark: remark
      }
    });
  }

  static async updateEmployee(id: string, data: Prisma.EmployeeUpdateInput): Promise<Employee> {
    const employee = await this.getEmployeeById(id);

    // Validate unique constraints if user attempts to modify them
    const orConditions = [];
    if (data.mobile && data.mobile !== employee.mobile) orConditions.push({ mobile: data.mobile as string });
    if (data.aadhaar && data.aadhaar !== employee.aadhaar) orConditions.push({ aadhaar: data.aadhaar as string });
    if (data.pan && data.pan !== employee.pan) orConditions.push({ pan: data.pan as string });

    if (orConditions.length > 0) {
      const existing = await prisma.employee.findFirst({ where: { OR: orConditions } });
      if (existing) {
        if (existing.mobile === data.mobile) throw new Error('Mobile number already registered.');
        if (existing.aadhaar === data.aadhaar) throw new Error('Aadhaar already registered.');
        if (existing.pan === data.pan) throw new Error('PAN already registered.');
      }
    }

    // Format Date strings properly before updating
    const updateData: any = { ...data };
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth as string | Date);
    if (data.joiningDate) updateData.joiningDate = new Date(data.joiningDate as string | Date);

    // Explicitly reset the status to PENDING and clear the correctionRemark
    updateData.status = EmployeeStatus.PENDING;
    updateData.correctionRemark = null;
    updateData.rejectReason = null; // Also clear rejection reasons to be clean

    return prisma.employee.update({
      where: { id },
      data: updateData
    });
  }

  static async searchEmployees(query: string) {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { surname: { contains: query, mode: 'insensitive' } },
          { employeeCode: { contains: query, mode: 'insensitive' } },
          { mobile: { contains: query } },
          { aadhaar: { contains: query } } 
        ]
      },
      take: 20, 
      orderBy: { uploadedAt: 'desc' }
    });

    return employees.map(emp => ({
      id: emp.id,
      firstName: emp.firstName,
      surname: emp.surname,
      employeeCode: emp.employeeCode,
      status: emp.status,
      rejectReason: (emp as EmployeeWithRejectReason).rejectReason,
      mobile: emp.mobile,
    }));
  }

  static async getMyUnitEmployees(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { units: { include: { unit: true } } }
    });
    
    if (!user || user.units.length === 0) return [];
    
    const unitNames = user.units.map(u => u.unit.name);
    
    return prisma.employee.findMany({
      where: { unit: { in: unitNames } },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        surname: true,
        employeeCode: true,
        mobile: true,
        status: true,
        uploadedAt: true,
        updatedAt: true
      }
    });
  }

  static async getAllEmployees(searchQuery?: string): Promise<Employee[]> {
    // Automatically assign missing units to 'Developer'
    const devUnit = await prisma.unit.findUnique({ where: { name: 'Developer' } });
    if (!devUnit) {
      throw new Error("Developer Unit not found in the database.");
    }

    await prisma.employee.updateMany({
      where: {
        OR: [
          { unit: null },
          { unit: "" },
          { unit: "N/A" }
        ]
      },
      data: {
        unit: devUnit.name
      }
    });

    const where: Prisma.EmployeeWhereInput = {};
    
    if (searchQuery) {
      where.OR = [
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { surname: { contains: searchQuery, mode: 'insensitive' } },
        { employeeCode: { contains: searchQuery, mode: 'insensitive' } },
        { mobile: { contains: searchQuery } } 
      ];
    }

    return prisma.employee.findMany({ 
      where, 
      orderBy: { uploadedAt: 'desc' } 
    });
  }

  static async getEmployeeById(id: string): Promise<Employee> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { documents: true }
    });
    if (!employee) throw new Error('Employee not found.');
    return employee;
  }

  static async updateEmployeeStatus(id: string, status: EmployeeStatus, rejectReason: string | null = null): Promise<Employee> {
    await this.getEmployeeById(id);
    return prisma.employee.update({ where: { id }, data: { status, rejectReason } });
  }

  static async updateEmployeeCode(id: string, employeeCode: string): Promise<Employee> {
    await this.getEmployeeById(id);
    const codeExists = await prisma.employee.findUnique({ where: { employeeCode } });
    if (codeExists && codeExists.id !== id) throw new Error('Employee code is already in use by another employee.');
    return prisma.employee.update({ where: { id }, data: { employeeCode } });
  }
}