import { Router, RequestHandler } from "express";
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, resetAdminPassword } from "../controllers/admin.controller";
import { authenticateToken, RequireRole, ROLES } from "../middleware/auth.middleware";

const router = Router();

// Strict DEV (DEV) protection on all Admin Management routes
router.get("/admins", authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, getAdmins as RequestHandler);
router.post("/admins", authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, createAdmin as RequestHandler);
router.put("/admins/:id", authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, updateAdmin as RequestHandler);
router.patch("/admins/:id/password", authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, resetAdminPassword as RequestHandler);
router.delete("/admins/:id", authenticateToken as RequestHandler, RequireRole(ROLES.DEV) as RequestHandler, deleteAdmin as RequestHandler);

export default router;