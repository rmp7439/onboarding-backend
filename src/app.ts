import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/error.middleware';
import { env } from './config/env';

const app: Application = express();

// Security Headers
app.use(helmet());

// Strict CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));

// Logging
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Body Parsing
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api', apiRouter);

// Centralized Error Handling
app.use(errorHandler);

export default app;