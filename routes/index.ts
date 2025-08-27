import { Router, Request, Response } from 'express';
import userRoutes from './userRoutes';
import adminRoutes from './adminRoutes';
import { formatResponse } from '../utils/helpers';

const router = Router();

// API Info route
router.get('/', (req: Request, res: Response) => {
  res.status(200).json(
    formatResponse('success', 'Caterine API is running', {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      endpoints: {
        users: '/api/v1/users',
        admin: '/api/v1/admin',
        health: '/api/v1/health',
        docs: '/api/v1/docs', // For future API documentation
      },
    })
  );
});

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json(
    formatResponse('success', 'Service is healthy', {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    })
  );
});

// API routes
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

// Handle undefined routes
router.all('*', (req: Request, res: Response) => {
  res.status(404).json(
    formatResponse('fail', `Route ${req.originalUrl} not found on this server`)
  );
});

export default router;