import app from './app';
import { env } from './config/env';

const startServer = (): void => {
  try {
    app.listen(env.PORT, () => {
      console.log(`[server]: Server is running in ${env.NODE_ENV} mode at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('[server]: Failed to start the server', error);
    process.exit(1);
  }
};

startServer();