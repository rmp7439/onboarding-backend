import { Router, RequestHandler } from "express";
import { getLogs } from "../controllers/activity-log.controller";
import { authenticateToken, RequireRole, ROLES } from "../middleware/auth.middleware";

const router = Router();

// Only DEV and ADMIN can access the audit logs
router.get(
  "/activity-logs", 
  authenticateToken as RequestHandler, 
  RequireRole(ROLES.DEV, ROLES.ADMIN) as RequestHandler, 
  getLogs as RequestHandler
);

export default router;