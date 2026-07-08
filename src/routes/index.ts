import { Router } from 'express';
import healthRouter from './health.route';
import employeeRouter from './employee.route';
import uploadRouter from './upload.route';
import dashboardRouter from './dashboard.route';
import authRouter from './auth.route';
import reportRouter from './report.route';

const router = Router();

router.use('/health', healthRouter);
router.use(employeeRouter);
router.use(uploadRouter);
router.use(dashboardRouter);
router.use(authRouter);
router.use(reportRouter);

export default router;