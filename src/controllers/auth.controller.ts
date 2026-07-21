import { Request, Response } from "express";
import { AuthService } from "../services/auth/auth.service";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, loginId, password } = req.body;
    
    if (loginId) {
      if (!password) {
        res.status(400).json({ success: false, error: "Login ID and password are required" });
        return;
      }
      const data = await AuthService.userLogin(loginId, password);
      res.status(200).json({ success: true, data });
      return;
    }

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email/Login ID and password are required" });
      return;
    }

    const data = await AuthService.login(email, password);
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    res.status(401).json({ success: false, error: message });
  }
};

export const employeeLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      res.status(400).json({ success: false, error: "Mobile number and OTP are required" });
      return;
    }

    const data = await AuthService.employeeLogin(mobile, otp);
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    res.status(401).json({ success: false, error: message });
  }
};