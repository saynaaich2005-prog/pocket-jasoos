import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV === 'development';

const isLocalOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (isDev && isLocalOrigin(origin)) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error('Not allowed by CORS'));
};

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Pocket Jasoos API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
