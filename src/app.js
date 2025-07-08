import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import maidRoutes from './routes/maid.routes.js';
import maidHireRoutes from './routes/maidHire.routes.js';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));


// Built-in Middlewares
app.use(express.json({ limit: '20mb' })); // Increase the limit to 20MB
app.use(express.urlencoded({ extended: true, limit: '20mb' })); // For URL-encoded data
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/maids/hire', maidHireRoutes);
app.use('/api/maids', maidRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

export default app;