import { RequestHandler } from "express";
import { EmployeeService } from "../services/employee/employee.service";
import { StorageService } from "../services/storage/storage.service";

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
    const search = req.query.search ? String(req.query.search) : undefined;
    const employees = await EmployeeService.getAllEmployees(search);
    res.status(200).json({ success: true, data: employees });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch employees" });
  }
};

export const getEmployeeProfile: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const profile = await EmployeeService.getEmployeeProfile(id);

    const selfieUrl = profile.selfieFilename
      ? await StorageService.getSignedUrl(profile.selfieFilename)
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...profile,
        selfieUrl,
      },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

export const getEmployeeById: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const employee = await EmployeeService.getEmployeeById(id);

    const selfieUrl = employee.selfieFilename
      ? await StorageService.getSignedUrl(employee.selfieFilename)
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...employee,
        selfieUrl,
      },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

export const searchEmployees: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const query = String(req.query.q || "");
    if (!query) {
      res.status(200).json({ success: true, data: [] });
      return;
    }
    const results = await EmployeeService.searchEmployees(query);
    res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Failed to search employees." });
  }
};

export const updateStatus: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id, status, rejectReason } = req.body;
    const updatedEmployee = await EmployeeService.updateEmployeeStatus(
      String(id),
      status,
      rejectReason
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