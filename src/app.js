import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware.js';
import userRoutes from './routes/user.routes.js';
import maidRoutes from './routes/maid.routes.js';
import maidHireRoutes from "./routes/maidHire.routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/maids/hire', maidHireRoutes);
app.use('/api/maids', maidRoutes);

// Error handler
app.use(errorHandler);

export default app;