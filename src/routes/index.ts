import { Router } from 'express';
import healthRouter from './health.route';
import employeeRouter from './employee.route';
import uploadRouter from './upload.route';
import dashboardRouter from './dashboard.route';
import authRouter from './auth.route';
import reportRouter from './report.route';
import downloadRouter from './download.route';
import bankRouter from './bank.route';

// 1. Import the new modules
import userRouter from './user.route';
import unitRouter from './unit.route';

const router = Router();

router.use('/health', healthRouter);
router.use(employeeRouter);
router.use(uploadRouter);
router.use(dashboardRouter);
router.use(authRouter);
router.use(reportRouter);
router.use(downloadRouter);

// 2. Register the new modules mirroring the existing pattern
router.use(userRouter);
router.use(unitRouter);
router.use(bankRouter);

export default router;