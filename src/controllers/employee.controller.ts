import { RequestHandler } from "express";
import { EmployeeService } from "../services/employee/employee.service";

export const register: RequestHandler = async (req, res): Promise<void> => {
  try {
    const employee = await EmployeeService.registerEmployee(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    const statusCode = error.message.includes("already") ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const getEmployees: RequestHandler = async (req, res): Promise<void> => {
  try {
    const employees = await EmployeeService.getAllEmployees();
    res.status(200).json({ success: true, data: employees });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch employees" });
  }
};

export const getEmployeeProfile: RequestHandler = async (req, res): Promise<void> => {
  try {
    const id = String(req.params.id); 
    const profile = await EmployeeService.getEmployeeProfile(id);
    
    // Construct the full URL for the selfie
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const selfieUrl = profile.selfieFilename 
      ? `${baseUrl}/uploads/jpg/${profile.selfieFilename}` 
      : null;

    // Strip out the internal selfieFilename before sending to the client
    const { selfieFilename, ...safeProfile } = profile;

    res.status(200).json({ 
      success: true, 
      data: { ...safeProfile, selfieUrl }
    });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const getEmployeeById: RequestHandler = async (req, res): Promise<void> => {
  try {
    const id = String(req.params.id); 
    const employee = await EmployeeService.getEmployeeById(id);
    
    // Construct the full URL for the selfie
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const selfieUrl = employee.selfieFilename 
      ? `${baseUrl}/uploads/jpg/${employee.selfieFilename}` 
      : null;

    res.status(200).json({ 
      success: true, 
      data: { ...employee, selfieUrl } // <-- Include selfieUrl in the response
    });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const updateStatus: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id, status } = req.body;
    const updatedEmployee = await EmployeeService.updateEmployeeStatus(
      String(id),
      status,
    );
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateCode: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id, employeeCode } = req.body;
    const updatedEmployee = await EmployeeService.updateEmployeeCode(
      String(id),
      employeeCode,
    );
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 409;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};