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
    const employeeWithRejectReason = employee as EmployeeWithRejectReason;

    return {
      id: employee.id,
      firstName: employee.firstName,
      surname: employee.surname,
      employeeCode: employee.employeeCode,
      status: employee.status,
      rejectReason: employeeWithRejectReason.rejectReason,
      mobile: employee.mobile,
      joiningDate: employee.joiningDate,
      gender: employee.gender,
      bloodGroup: employee.bloodGroup,
      selfieFilename: employee.selfieFilename,
    };
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

  static async getAllEmployees(searchQuery?: string): Promise<Employee[]> {
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