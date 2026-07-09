import { prisma } from '../../config/prisma';
import { Employee, EmployeeStatus, Prisma} from '@prisma/client';

export class EmployeeService {
  /**
   * Registers a new employee, ensuring uniqueness for Aadhaar, PAN, and Mobile.
   */
  static async registerEmployee(data: Prisma.EmployeeCreateInput): Promise<Employee> {
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { mobile: data.mobile },
          { aadhaar: data.aadhaar },
          { pan: data.pan }
        ]
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

  static async getAllEmployees(): Promise<Employee[]> {
    return prisma.employee.findMany({
      orderBy: { uploadedAt: 'desc' }
    });
  }

  static async getEmployeeById(id: string): Promise<Employee> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { documents: true } // Assuming you want to see documents when viewing details
    });

    if (!employee) {
      throw new Error('Employee not found.');
    }
    return employee;
  }

  static async updateEmployeeStatus(id: string, status: EmployeeStatus): Promise<Employee> {
    // Verify existence first
    await this.getEmployeeById(id);

    return prisma.employee.update({
      where: { id },
      data: { status }
    });
  }

  static async updateEmployeeCode(id: string, employeeCode: string): Promise<Employee> {
    // Verify existence first
    await this.getEmployeeById(id);

    // Check if the code is already assigned to someone else
    const codeExists = await prisma.employee.findUnique({
      where: { employeeCode }
    });

    if (codeExists && codeExists.id !== id) {
      throw new Error('Employee code is already in use by another employee.');
    }

    return prisma.employee.update({
      where: { id },
      data: { employeeCode }
    });
  }
}