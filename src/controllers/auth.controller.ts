import { Request, Response } from "express";

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  
  // Basic mock authentication wrapper on backend for now
  if (email === "admin@example.com" && password === "password123") {
    res.status(200).json({
      success: true,
      data: {
        token: "mock_jwt_token_1234567890",
        user: { id: "u_1", name: "System Admin", email, role: "ADMIN" }
      }
    });
  } else {
    res.status(401).json({ success: false, error: "Invalid email or password" });
  }
};