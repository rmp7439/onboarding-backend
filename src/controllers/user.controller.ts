import { Request, Response } from 'express';
import { UserService } from '../services/user/user.service';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserService.getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mobile, password } = req.body;
    if (!name || !mobile || !password) {
      res.status(400).json({ success: false, error: 'Name, mobile, and password are required.' });
      return;
    }
    const user = await UserService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    const statusCode = error.message.includes('already registered') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // FIX: Cast id to String
    const user = await UserService.updateUser(String(id), req.body);
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    const statusCode = error.message.includes('already registered') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // FIX: Cast id to String
    await UserService.deleteUser(String(id));
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to delete user.' });
  }
};

export const assignUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { unitIds } = req.body;
    
    if (!Array.isArray(unitIds)) {
      res.status(400).json({ success: false, error: 'unitIds must be an array.' });
      return;
    }

    // FIX: Cast id to String
    const updatedUser = await UserService.assignUnits(String(id), unitIds);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};