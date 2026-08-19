import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import healthRoutes from './routes/healthRoutes';
import screeningRoutes from './routes/screeningRoutes';
import resumeRoutes from './routes/resumeRoutes';
import jobRoutes from './routes/jobRoutes';

const app = express();

// ---- Middleware ---------------------------------------------

// CORS — allow frontend dev origin
app.use(
  cors({
    origin:
      config.nodeEnv === 'production'
        ? process.env.FRONTEND_URL ?? 'http://localhost:5173'
        : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  })
);

// Parse JSON bodies (for non-multipart routes)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Request logging (does NOT log body content)
app.use(requestLogger);

// ---- Routes ------------------------------------------------

app.use('/api/health', healthRoutes);
app.use('/api/screen', screeningRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);

// ---- 404 + Error handlers ----------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

// ---- Start server ------------------------------------------

const server = app.listen(config.port, () => {
  logger.info(`Smart Resume Screener API started`, {
    port: config.port,
    env: config.nodeEnv,
    llmModel: config.llmModel,
    shortlistThreshold: config.shortlistThreshold,
  });
  logger.info(`Health check: http://localhost:${config.port}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
