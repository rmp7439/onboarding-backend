import { Router, Request, Response } from 'express';
import { env } from '../config/env';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

export default router;