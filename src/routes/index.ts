import { Router } from 'express';
import healthRouter from './health.route';
import employeeRouter from './employee.route';
import uploadRouter from './upload.route';
import dashboardRouter from './dashboard.route';
import authRouter from './auth.route';
import reportRouter from './report.route';
import downloadRouter from './download.route';
import userRouter from './user.route'; // NEW
import unitRouter from './unit.route'; // NEW

const router = Router();

router.use('/health', healthRouter);
router.use(employeeRouter);
router.use(uploadRouter);
router.use(dashboardRouter);
router.use(authRouter);
router.use(reportRouter);
router.use(downloadRouter);
router.use(userRouter); // NEW
router.use(unitRouter); // NEW

export default router;