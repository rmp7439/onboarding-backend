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

  /**
   * Retrieves an employee profile with only non-sensitive data for the mobile app.
   */
  static async getEmployeeProfile(id: string) {
    // Reuse existing logic to handle existence checks and basic fetch
    const employee = await this.getEmployeeById(id);

    // Return only the safe, requested fields
    return {
      id: employee.id,
      firstName: employee.firstName,
      surname: employee.surname,
      employeeCode: employee.employeeCode,
      status: employee.status,
      mobile: employee.mobile,
      joiningDate: employee.joiningDate,
      gender: employee.gender,
      bloodGroup: employee.bloodGroup,
      selfieFilename: employee.selfieFilename, // Needed to construct the URL in the controller
    };
  }

  /**
   * Searches employees based on a text query.
   * Only returns safe, non-sensitive fields for the mobile app list view.
   */
  static async searchEmployees(query: string) {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { surname: { contains: query, mode: 'insensitive' } },
          { employeeCode: { contains: query, mode: 'insensitive' } },
          { mobile: { contains: query } },
          { aadhaar: { contains: query } } // Allow searching by Aadhaar
        ]
      },
      take: 20, // Limit results for performance
      orderBy: { uploadedAt: 'desc' }
    });

    // Strip sensitive info before returning to the mobile app
    return employees.map(emp => ({
      id: emp.id,
      firstName: emp.firstName,
      surname: emp.surname,
      employeeCode: emp.employeeCode,
      status: emp.status,
      mobile: emp.mobile,
    }));
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