import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';

// Import configurations
import config from './config/env';
import connectDB from './config/database';

// Import routes
import apiRoutes from './routes/index';

// Import middleware
import { globalErrorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Import utils
import { formatResponse } from './utils/helpers';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.connectDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async connectDatabase(): Promise<void> {
    try {
      await connectDB();
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      process.exit(1);
    }
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(
      cors({
        origin: config.corsOrigin,
        credentials: true,
      })
    );

    // Compression
    this.app.use(compression());

    // Rate limiting
    this.app.use('/api', generalLimiter);

    // Logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // File upload middleware
    this.app.use(fileUpload({
      useTempFiles: true,
      tempFileDir: '/tmp/',
      limits: { fileSize: config.fileUpload.maxFileSize },
      abortOnLimit: true,
      responseOnLimit: 'File size limit exceeded',
    }));

    // Static files
    this.app.use(express.static('public'));
  }

  private initializeRoutes(): void {
    // Welcome route
    this.app.get('/', (req, res) => {
      res.status(200).json(
        formatResponse('success', 'Welcome to Caterine API! 🚀', {
          version: '1.0.0',
          environment: config.nodeEnv,
          timestamp: new Date().toISOString(),
          documentation: '/api/v1',
        })
      );
    });

    // API routes
    this.app.use('/api/v1', apiRoutes);

    // Handle undefined routes
    this.app.all('*', (req, res) => {
      res.status(404).json(
        formatResponse('fail', `Route ${req.originalUrl} not found on this server`)
      );
    });
  }

  private initializeErrorHandling(): void {
    // Global error handling middleware
    this.app.use(globalErrorHandler);
  }

  public listen(): void {
    const PORT = config.port;
    
    this.app.listen(PORT, () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
      
      if (config.nodeEnv === 'development') {
        console.log(`🔥 Development server ready at http://localhost:${PORT}`);
      }
    });
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Create and start the application
const application = new App();
application.listen();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  process.exit(0);
});

export default application.app;