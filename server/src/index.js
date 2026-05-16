import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import User from './models/User.js';
import Board from './models/Board.js';
import Feedback from './models/Feedback.js';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import feedbackRoutes from './routes/feedback.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — support multiple CORS origins (comma-separated in env)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const start = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synced');

    app.listen(PORT, () => {
      console.log(`🚀 KanDoo API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
