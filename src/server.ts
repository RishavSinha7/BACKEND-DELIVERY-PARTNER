import express from 'express';
import dotenv from 'dotenv';
import bookingsRoutes from './routes/bookings';
import driversRoutes from './routes/drivers';
import usersRoutes from './routes/users';
import couponsRoutes from './routes/coupons';
import transactionsRoutes from './routes/transactions';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import cors from './middleware/cors';

dotenv.config();

const app = express();

app.use(express.json());
app.use(logger);
app.use(cors);

app.use('/api/bookings', bookingsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/transactions', transactionsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 