import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API lista en http://localhost:${port}`));
