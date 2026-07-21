import { Request, Response } from 'express';
import { UnitService } from '../services/unit/unit.service';

export const getUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const units = await UnitService.getUnits();
    res.status(200).json({ success: true, data: units });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch units.' });
  }
};

export const createUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Unit name is required.' });
      return;
    }
    const unit = await UnitService.createUnit(name);
    res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Unit name is required.' });
      return;
    }
    // FIX: Cast id to String
    const unit = await UnitService.updateUnit(String(id), name);
    res.status(200).json({ success: true, data: unit });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const deleteUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // FIX: Cast id to String
    await UnitService.deleteUnit(String(id));
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to delete unit.' });
  }
};