import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export const validateRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // These base fields remain universally required for all employees
    const baseRequiredFields = [
      'unit', 
      'firstName', 'surname', 'fatherName',
      'dateOfBirth', 'joiningDate', 'mobile', 
      'permanentAddress', 'currentAddress', 'city', 'state', 'pinCode', 
      'permanentPoliceStation', 'currentCity', 'currentState', 'currentPinCode', 
      'emergencyName', 'emergencyRelation', 'emergencyPhone'
    ];

    const missingBaseFields = baseRequiredFields.filter(field => !req.body[field]);

    if (missingBaseFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required base fields: ${missingBaseFields.join(', ')}`
      });
      return;
    }

    // Process unit-specific required fields dynamically
    if (req.body.unit) {
      const unitRecord = await prisma.unit.findUnique({ where: { name: req.body.unit } });
      if (unitRecord && unitRecord.requiredFields && unitRecord.requiredFields.length > 0) {
        const missingDynamicFields = unitRecord.requiredFields.filter((field: string) => !req.body[field]);
        
        if (missingDynamicFields.length > 0) {
          res.status(400).json({
            success: false,
            error: `Missing unit-specific required fields: ${missingDynamicFields.join(', ')}`
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { id, status, rejectReason } = req.body;
  
  if (!id || !status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Valid ID and Status (PENDING, APPROVED, REJECTED) are required' });
    return;
  }

  if (status === 'REJECTED') {
    if (!rejectReason || typeof rejectReason !== 'string' || rejectReason.trim() === '') {
      res.status(400).json({ success: false, error: 'Reject reason is required when status is REJECTED.' });
      return;
    }
    
    req.body.rejectReason = rejectReason.trim();
    
    if (req.body.rejectReason.length > 250) {
      res.status(400).json({ success: false, error: 'Reject reason cannot exceed 250 characters.' });
      return;
    }
  } else {
    // Force rejectReason to null for PENDING or APPROVED
    req.body.rejectReason = null;
  }

  next();
};

export const validateCodeUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { id, employeeCode } = req.body;
  if (!id || !employeeCode) {
    res.status(400).json({ success: false, error: 'Employee ID and Employee Code are required' });
    return;
  }
  next();
};

export const validateReturnForCorrection = (req: Request, res: Response, next: NextFunction): void => {
  const { remark } = req.body;
  if (!remark || typeof remark !== 'string' || remark.trim() === '') {
    res.status(400).json({ success: false, error: 'Correction remark is required.' });
    return;
  }
  if (remark.length > 500) {
    res.status(400).json({ success: false, error: 'Remark cannot exceed 500 characters.' });
    return;
  }
  req.body.remark = remark.trim();
  next();
};

export const validateEmployeeUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const baseRequiredFields = [
      'unit', 
      'firstName', 'surname', 'fatherName', 
      'dateOfBirth', 'joiningDate', 'mobile', 
      'permanentAddress', 'currentAddress', 'city', 'state', 'pinCode', 
      'permanentPoliceStation', 'currentCity', 'currentState', 'currentPinCode', 
      'emergencyName', 'emergencyRelation', 'emergencyPhone'
    ];

    const missingBaseFields = baseRequiredFields.filter(field => !req.body[field]);

    if (missingBaseFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required base fields for update: ${missingBaseFields.join(', ')}`
      });
      return;
    }

    if (req.body.unit) {
      const unitRecord = await prisma.unit.findUnique({ where: { name: req.body.unit } });
      if (unitRecord && unitRecord.requiredFields && unitRecord.requiredFields.length > 0) {
        const missingDynamicFields = unitRecord.requiredFields.filter((field: string) => !req.body[field]);
        
        if (missingDynamicFields.length > 0) {
          res.status(400).json({
            success: false,
            error: `Missing unit-specific required fields for update: ${missingDynamicFields.join(', ')}`
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};