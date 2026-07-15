import { Request, Response } from "express";
import { AuthService } from "../services/auth/auth.service";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    const data = await AuthService.login(email, password);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};

// Add alongside the existing admin login export
export const employeeLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      res.status(400).json({ success: false, error: "Mobile number and OTP are required" });
      return;
    }

    const data = await AuthService.employeeLogin(mobile, otp);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};