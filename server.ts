import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './server/config/db.js';
import authRoutes from './server/routes/authRoutes.js';
import candidateRoutes from './server/routes/candidateRoutes.js';
import teacherRoutes from './server/routes/teacherRoutes.js';
import { DataService } from './server/services/dataService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for dev Vite HMR and dynamic client modules
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection & initial seeding
(async () => {
  try {
    await connectDB();
    await DataService.seedInitialData();
  } catch (err) {
    console.error('Failed to initialize database/seeds:', err);
  }
})();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ApexExam MERN Online Examination System',
    timestamp: new Date().toISOString(),
  });
});

// Seed reset endpoint for quick testing
app.post('/api/system/reset-demo', async (req, res) => {
  try {
    await DataService.seedInitialData();
    res.json({ success: true, message: 'Demo data verified and ready.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset demo data.' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/candidate', candidateRoutes);

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Dev vs Production static/Vite mounting
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ApexExam Server] Running at http://localhost:${PORT} in ${isProduction ? 'production' : 'development'} mode.`);
  });
}

startServer();
