import { Router, RequestHandler } from "express";
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../controllers/unit.controller";
import {
  authenticateToken,
  RequireRole,
  ROLES,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/units",
  authenticateToken,
  RequireRole(ROLES.SUPERVISOR, ROLES.DEV, ROLES.ADMIN),
  getUnits,
);
router.post(
  "/units",
  authenticateToken as RequestHandler,
  RequireRole(ROLES.DEV) as RequestHandler,
  createUnit as RequestHandler,
);
router.put(
  "/units/:id",
  authenticateToken as RequestHandler,
  RequireRole(ROLES.DEV) as RequestHandler,
  updateUnit as RequestHandler,
);
router.delete(
  "/units/:id",
  authenticateToken as RequestHandler,
  RequireRole(ROLES.DEV) as RequestHandler,
  deleteUnit as RequestHandler,
);

export default router;