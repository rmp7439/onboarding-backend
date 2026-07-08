import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};