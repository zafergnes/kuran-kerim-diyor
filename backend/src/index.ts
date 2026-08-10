import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import favoriteRoutes from './routes/favorites.routes';
import collectionRoutes from './routes/collections.routes';
import commentRoutes from './routes/comments.routes';
import reportRoutes from './routes/reports.routes';
import statsRoutes from './routes/stats.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import verseChatRoutes from './routes/verse-chat.routes';
import analyticsRoutes from './routes/analytics.routes';
import supportRoutes from './routes/support.routes';
import { startModerationWorker } from './services/worker.service';
import { NotificationService } from './services/notification.service';

import dailyRoutes from './routes/daily.routes';

const app = express();

// Trust proxy header to allow rate limiter to read client IP behind reverse proxy (e.g. Nginx)
app.set('trust proxy', 1);

// Start the background worker
startModerationWorker();

// Start the notification scheduler
NotificationService.initCron();

const port = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet()); // Secures HTTP headers
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://kurannediyor.com.tr,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed'));
  },
}));
app.use(express.json({ limit: '100kb' }));

// Rate Limiting: Max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/daily-context', dailyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verse-chat', verseChatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/support', supportRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Kuran Backend is secure and running' });
});

app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[Server]: Server is running at http://0.0.0.0:${port}`);
});
