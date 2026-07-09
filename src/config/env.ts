import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

const requiredEnvs = ['DATABASE_URL'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  throw new Error(`FATAL: Missing required environment variables: ${missingEnvs.join(', ')}`);
}

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
};