import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes/index';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);

export default app;