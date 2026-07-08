import { Request, Response, NextFunction } from 'express';

export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const requiredFields = [
    'firstName', 'surname', 'fatherName', 'gender', 'bloodGroup', 
    'dateOfBirth', 'joiningDate', 'mobile', 'aadhaar', 'pan', 
    'permanentAddress', 'currentAddress', 'city', 'state', 'pinCode', 
    'bankName', 'accountNumber', 'ifsc', 'branch', 'micr', 
    'emergencyName', 'emergencyRelation', 'emergencyPhone'
  ];

  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
    return;
  }

  next();
};

export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { id, status } = req.body;
  if (!id || !status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    res.status(400).json({ success: false, error: 'Valid ID and Status (PENDING, APPROVED, REJECTED) are required' });
    return;
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