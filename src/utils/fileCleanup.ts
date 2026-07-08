import fs from 'fs';
import { logger } from './logger';

export const cleanupFile = (filePath?: string): void => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) logger.error(`Failed to delete orphaned file: ${filePath}`, err);
      else logger.info(`Successfully cleaned up orphaned file: ${filePath}`);
    });
  }
};