import { Request, Response } from 'express';
import { BankService } from '../services/bank/bank.service';

export const getBanks = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.active === 'true';
    const banks = await BankService.getBanks(activeOnly);
    res.status(200).json({ success: true, data: banks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch banks.' });
  }
};

export const createBank = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ success: false, error: 'Bank name is required.' });
      return;
    }
    const bank = await BankService.createBank(name.trim());
    res.status(201).json({ success: true, data: bank });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const updateBank = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ success: false, error: 'Bank name is required.' });
      return;
    }
    const bank = await BankService.updateBank(String(id), name.trim(), Boolean(isActive));
    res.status(200).json({ success: true, data: bank });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export const deleteBank = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await BankService.deleteBank(String(id));
    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to delete bank.' });
  }
};