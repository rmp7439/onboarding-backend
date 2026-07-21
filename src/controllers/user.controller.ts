import { RequestHandler } from "express";
import { UserService } from "../services/user/user.service";

export const createUser: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { name, loginId, password, status } = req.body;

    if (!name || !loginId || !password) {
      res.status(400).json({
        success: false,
        error: "Name, loginId, and password are required",
      });
      return;
    }

    const user = await UserService.createUser({
      name,
      loginId,
      password,
      status,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("unique") ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};