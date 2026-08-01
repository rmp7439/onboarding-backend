import { RequestHandler } from "express";
import { EmployeeService } from "../services/employee/employee.service";
import { StorageService } from "../services/storage/storage.service";
import { UserService } from "../services/user/user.service";
import { ActivityLogService } from "../services/logging/activity-log.service";

export const register: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;

    // Strict Backend Validation: NEVER trust the frontend
    if (user && user.role === "USER") {
      const hasUnit = await UserService.checkUserHasUnitByName(
        user.id,
        req.body.unit,
      );
      if (!hasUnit) {
        res.status(403).json({
          success: false,
          error:
            "Forbidden: The selected Unit is not assigned to your account.",
        });
        return;
      }
    }

    const employee = await EmployeeService.registerEmployee(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    const statusCode = error.message.includes("already") ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const getMyApplications: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const employees = await EmployeeService.getMyUnitEmployees(userId);
    res.status(200).json({ success: true, data: employees });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch applications." });
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

export const returnForCorrection: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const { remark } = req.body;
    const updatedEmployee = await EmployeeService.returnForCorrection(
      String(req.params.id),
      remark,
    );
    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateEmployee: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const user = (req as any).user;

    // Strict Backend Validation: NEVER trust the frontend
    if (user && user.role === "USER") {
      const hasUnit = await UserService.checkUserHasUnitByName(
        user.id,
        req.body.unit,
      );
      if (!hasUnit) {
        res.status(403).json({
          success: false,
          error:
            "Forbidden: The selected Unit is not assigned to your account.",
        });
        return;
      }
    }

    const employee = await EmployeeService.updateEmployee(
      String(req.params.id),
      req.body,
    );

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("already")
      ? 409
      : error.message.includes("not found")
        ? 404
        : 400;
    res.status(statusCode).json({ success: false, error: error.message });
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
      rejectReason,
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

export const adminUpdateEmployee: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  try {
    const admin = (req as any).admin;
    const actorContext = {
      id: admin.id,
      name: admin.name,
      username: admin.username,
      role: admin.role,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };

    const employee = await EmployeeService.adminUpdateEmployee(
      String(req.params.id),
      req.body,
      actorContext,
    );

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("already")
      ? 409
      : error.message.includes("not found")
        ? 404
        : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const deleteEmployee: RequestHandler = async (req, res): Promise<void> => {
  const admin = (req as any).admin || (req as any).user;
  
  const actorContext = {
    id: admin?.id || "unknown",
    name: admin?.name || "unknown",
    username: admin?.username || "unknown",
    role: admin?.role || "unknown",
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  };

  // Strict Authorization Constraint
  if (actorContext.username !== "dev" && actorContext.username !== "nikhil") {
    res.status(403).json({ 
      success: false, 
      error: "Forbidden: You do not have permission to delete employee records." 
    });
    return;
  }

  try {
    await EmployeeService.deleteEmployee(String(req.params.id), actorContext);
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    // Log Failed Attempt
    await ActivityLogService.logAction({
      action: "EMPLOYEE_DELETE_FAILED",
      actor: actorContext,
      target: { id: String(req.params.id), name: "Unknown", type: "EMPLOYEE" },
      changes: [{ field: "reason", old: null, new: error.message }],
    });

    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};