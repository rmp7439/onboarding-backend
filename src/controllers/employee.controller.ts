import { Request, Response } from "express";
import { EmployeeService } from "../services/employee/employee.service";

// Define explicit interfaces for your request parameters and bodies
interface EmployeeIdParam {
  id: string;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await EmployeeService.registerEmployee(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    const statusCode = error.message.includes("already") ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const getEmployees = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const employees = await EmployeeService.getAllEmployees();
    res.status(200).json({ success: true, data: employees });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch employees" });
  }
};

export const getEmployeeById = async (
  req: Request<EmployeeIdParam>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params; // TS now knows 'id' is strictly a string
    const employee = await EmployeeService.getEmployeeById(id);
    res.status(200).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id, status } = req.body;
    const updatedEmployee = await EmployeeService.updateEmployeeStatus(
      id,
      status,
    );
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id, employeeCode } = req.body;
    const updatedEmployee = await EmployeeService.updateEmployeeCode(
      id,
      employeeCode,
    );
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 409;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};